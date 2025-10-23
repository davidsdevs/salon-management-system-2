import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

const functions = getFunctions();

export const productService = {
  /**
   * Creates a new product in the products collection.
   * @param {object} productData - The data for the new product.
   * @returns {Promise<{success: boolean, id?: string, error?: string}>}
   */
  createProduct: async (productData) => {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetches all products from the products collection.
   * @param {object} filters - Optional filters for the products.
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getAllProducts: async (filters = {}) => {
    try {
      const productsCollection = collection(db, 'products');
      const q = query(productsCollection, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
      return { success: true, data: products };
    } catch (error) {
      console.error('Error getting all products:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetches a single product by its ID.
   * @param {string} id - The ID of the product to fetch.
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  getProductById: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Product not found' };
      }
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Updates an existing product.
   * @param {string} id - The ID of the product to update.
   * @param {object} newData - The new data for the product.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  updateProduct: async (id, newData) => {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...newData,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deletes a product by its ID.
   * @param {string} id - The ID of the product to delete.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  deleteProduct: async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Searches products using backend function.
   * @param {string} searchTerm - The search term.
   * @param {object} filters - Optional filters for the search.
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  searchProducts: async (searchTerm, filters = {}) => {
    try {
      const searchMasterProducts = httpsCallable(functions, 'searchMasterProducts');
      const result = await searchMasterProducts({ searchTerm, filters });
      
      if (result.data.success) {
        return { success: true, data: result.data.data };
      } else {
        return { success: false, error: result.data.error || 'Failed to search products' };
      }
    } catch (error) {
      console.error('Error searching products:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Gets product statistics using backend function.
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  getProductStats: async () => {
    try {
      const getMasterProductStats = httpsCallable(functions, 'getMasterProductStats');
      const result = await getMasterProductStats();
      
      if (result.data.success) {
        return { success: true, data: result.data.data };
      } else {
        return { success: false, error: result.data.error || 'Failed to get product stats' };
      }
    } catch (error) {
      console.error('Error getting product stats:', error);
      return { success: false, error: error.message };
    }
  },
};