const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

/**
 * Creates a new master product
 */
exports.createMasterProduct = onCall(async (request) => {
  try {
    const { productData } = request.data;
    
    // Validate required fields
    if (!productData.name || !productData.category || !productData.brand) {
      throw new HttpsError('invalid-argument', 'Missing required fields: name, category, brand');
    }

    // Add timestamps
    const product = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create product in Firestore
    const docRef = await db.collection('master_products').add(product);
    
    return {
      success: true,
      id: docRef.id,
      message: 'Product created successfully'
    };
  } catch (error) {
    console.error('Error creating master product:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Gets all master products with optional filtering
 */
exports.getMasterProducts = onCall(async (request) => {
  try {
    const { filters = {} } = request.data;
    
    let query = db.collection('master_products');
    
    // Apply filters
    if (filters.category && filters.category !== 'All') {
      query = query.where('category', '==', filters.category);
    }
    
    if (filters.brand && filters.brand !== 'All') {
      query = query.where('brand', '==', filters.brand);
    }
    
    if (filters.supplier && filters.supplier !== 'All') {
      query = query.where('supplier', '==', filters.supplier);
    }
    
    if (filters.status && filters.status !== 'All') {
      query = query.where('status', '==', filters.status);
    }
    
    // Order by name
    query = query.orderBy('name', 'asc');
    
    const snapshot = await query.get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));
    
    return {
      success: true,
      data: products
    };
  } catch (error) {
    console.error('Error getting master products:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Gets a single master product by ID
 */
exports.getMasterProductById = onCall(async (request) => {
  try {
    const { productId } = request.data;
    
    if (!productId) {
      throw new HttpsError('invalid-argument', 'Product ID is required');
    }
    
    const doc = await db.collection('master_products').doc(productId).get();
    
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }
    
    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      }
    };
  } catch (error) {
    console.error('Error getting master product by ID:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Updates a master product
 */
exports.updateMasterProduct = onCall(async (request) => {
  try {
    const { productId, productData } = request.data;
    
    if (!productId) {
      throw new HttpsError('invalid-argument', 'Product ID is required');
    }
    
    // Check if product exists
    const doc = await db.collection('master_products').doc(productId).get();
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }
    
    // Update with new data and timestamp
    const updateData = {
      ...productData,
      updatedAt: new Date(),
    };
    
    await db.collection('master_products').doc(productId).update(updateData);
    
    return {
      success: true,
      message: 'Product updated successfully'
    };
  } catch (error) {
    console.error('Error updating master product:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Deletes a master product
 */
exports.deleteMasterProduct = onCall(async (request) => {
  try {
    const { productId } = request.data;
    
    if (!productId) {
      throw new HttpsError('invalid-argument', 'Product ID is required');
    }
    
    // Check if product exists
    const doc = await db.collection('master_products').doc(productId).get();
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }
    
    // Delete the product
    await db.collection('master_products').doc(productId).delete();
    
    return {
      success: true,
      message: 'Product deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting master product:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Searches master products by name or description
 */
exports.searchMasterProducts = onCall(async (request) => {
  try {
    const { searchTerm, filters = {} } = request.data;
    
    if (!searchTerm || searchTerm.trim() === '') {
      // If no search term, return all products with filters
      return await exports.getMasterProducts({ data: { filters } });
    }
    
    let query = db.collection('master_products');
    
    // Apply filters first
    if (filters.category && filters.category !== 'All') {
      query = query.where('category', '==', filters.category);
    }
    
    if (filters.brand && filters.brand !== 'All') {
      query = query.where('brand', '==', filters.brand);
    }
    
    if (filters.supplier && filters.supplier !== 'All') {
      query = query.where('supplier', '==', filters.supplier);
    }
    
    if (filters.status && filters.status !== 'All') {
      query = query.where('status', '==', filters.status);
    }
    
    // Order by name
    query = query.orderBy('name', 'asc');
    
    const snapshot = await query.get();
    const allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));
    
    // Filter by search term (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    const filteredProducts = allProducts.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.upc.toLowerCase().includes(searchLower) ||
      product.brand.toLowerCase().includes(searchLower) ||
      product.supplier.toLowerCase().includes(searchLower)
    );
    
    return {
      success: true,
      data: filteredProducts
    };
  } catch (error) {
    console.error('Error searching master products:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Gets product statistics
 */
exports.getMasterProductStats = onCall(async (request) => {
  try {
    const snapshot = await db.collection('master_products').get();
    const products = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: products.length,
      active: products.filter(p => p.status === 'Active').length,
      inactive: products.filter(p => p.status === 'Inactive').length,
      categories: [...new Set(products.map(p => p.category))].length,
      brands: [...new Set(products.map(p => p.brand))].length,
      suppliers: [...new Set(products.map(p => p.supplier))].length,
    };
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting master product stats:', error);
    throw new HttpsError('internal', error.message);
  }
});
