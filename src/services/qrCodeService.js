// src/services/qrCodeService.js
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { inventoryService } from './inventoryService';
import { productService } from './productService';

class QRCodeService {
  constructor() {
    this.qrCodesCollection = 'qr_codes';
  }

  /**
   * Generate QR code data for a product batch
   * @param {Object} params - { productId, batchId, branchId, expirationDate, price }
   * @returns {Promise<Object>} - { success, qrCodeData, qrCodeId, message }
   */
  async generateQRCodeForBatch({ productId, batchId = null, branchId = null, expirationDate = null, price = null }) {
    try {
      // Get product details
      const productResult = await productService.getProductById(productId);
      if (!productResult.success) {
        return { success: false, message: 'Product not found' };
      }

      let batch = null;
      let batchNumber = 'N/A';

      // Only get batch details if batchId and branchId are provided
      if (batchId && branchId) {
        const batchesResult = await inventoryService.getProductBatches(branchId, productId);
        if (batchesResult.success) {
          batch = batchesResult.batches.find(b => b.id === batchId);
          if (batch) {
            batchNumber = batch.batchNumber;
          }
        }
      }

      // Create QR code data object
      const qrCodeData = {
        productId: productId,
        productName: productResult.product.name,
        batchId: batchId || null,
        batchNumber: batchNumber,
        branchId: branchId || null,
        expirationDate: expirationDate ? Timestamp.fromDate(new Date(expirationDate)) : null,
        price: price || productResult.product.otcPrice || 0,
        unitCost: batch?.unitCost || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Store QR code data in Firestore
      const qrCodeRef = await addDoc(collection(db, this.qrCodesCollection), qrCodeData);

      // Create QR code string (JSON encoded for scanning)
      const qrCodeString = JSON.stringify({
        qrCodeId: qrCodeRef.id,
        productId: productId,
        batchId: batchId || null,
        batchNumber: batchNumber
      });

      return {
        success: true,
        qrCodeId: qrCodeRef.id,
        qrCodeData: {
          ...qrCodeData,
          id: qrCodeRef.id,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        qrCodeString: qrCodeString,
        message: 'QR code generated successfully'
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Scan QR code and retrieve product information
   * @param {string} qrCodeString - The scanned QR code string
   * @returns {Promise<Object>} - { success, productInfo, batchInfo, message }
   */
  async scanQRCode(qrCodeString) {
    try {
      // Parse QR code string
      let qrData;
      try {
        qrData = JSON.parse(qrCodeString);
      } catch (parseError) {
        // If it's not JSON, try to find by QR code ID directly
        qrData = { qrCodeId: qrCodeString };
      }

      // Find QR code in Firestore
      let qrCodeDoc;
      if (qrData.qrCodeId) {
        const qrCodeRef = doc(db, this.qrCodesCollection, qrData.qrCodeId);
        qrCodeDoc = await getDoc(qrCodeRef);
      } else if (qrData.batchId && qrData.productId) {
        // Find by batch and product
        const q = query(
          collection(db, this.qrCodesCollection),
          where('productId', '==', qrData.productId),
          where('batchId', '==', qrData.batchId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          qrCodeDoc = querySnapshot.docs[0];
        }
      }

      if (!qrCodeDoc || !qrCodeDoc.exists()) {
        return { success: false, message: 'QR code not found' };
      }

      const qrCodeData = qrCodeDoc.data();

      // Get product details
      const productResult = await productService.getProductById(qrCodeData.productId);
      if (!productResult.success) {
        return { success: false, message: 'Product not found' };
      }

      // Get batch details
      const batchesResult = await inventoryService.getProductBatches(
        qrCodeData.branchId,
        qrCodeData.productId
      );
      const batch = batchesResult.batches?.find(b => b.id === qrCodeData.batchId);

      return {
        success: true,
        productInfo: {
          id: productResult.product.id,
          name: productResult.product.name,
          brand: productResult.product.brand,
          category: productResult.product.category,
          price: qrCodeData.price || productResult.product.otcPrice || 0,
          imageUrl: productResult.product.imageUrl
        },
        batchInfo: batch ? {
          id: batch.id,
          batchNumber: batch.batchNumber,
          expirationDate: batch.expirationDate,
          remainingQuantity: batch.remainingQuantity,
          unitCost: batch.unitCost,
          status: batch.status
        } : null,
        qrCodeInfo: {
          id: qrCodeDoc.id,
          expirationDate: qrCodeData.expirationDate?.toDate ? qrCodeData.expirationDate.toDate() : 
                          qrCodeData.expirationDate instanceof Date ? qrCodeData.expirationDate :
                          qrCodeData.expirationDate ? new Date(qrCodeData.expirationDate) : null,
          createdAt: qrCodeData.createdAt?.toDate ? qrCodeData.createdAt.toDate() : new Date()
        },
        message: 'QR code scanned successfully'
      };
    } catch (error) {
      console.error('Error scanning QR code:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get all QR codes for a product
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - { success, qrCodes, message }
   */
  async getQRCodesByProduct(productId) {
    try {
      const q = query(
        collection(db, this.qrCodesCollection),
        where('productId', '==', productId)
      );
      const querySnapshot = await getDocs(q);
      
      const qrCodes = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        qrCodes.push({
          id: doc.id,
          ...data,
          expirationDate: data.expirationDate?.toDate ? data.expirationDate.toDate() : 
                         data.expirationDate instanceof Date ? data.expirationDate :
                         data.expirationDate ? new Date(data.expirationDate) : null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        });
      });

      return { success: true, qrCodes };
    } catch (error) {
      console.error('Error getting QR codes by product:', error);
      return { success: false, message: error.message, qrCodes: [] };
    }
  }

  /**
   * Get all QR codes for a batch
   * @param {string} batchId - Batch ID
   * @returns {Promise<Object>} - { success, qrCodes, message }
   */
  async getQRCodesByBatch(batchId) {
    try {
      const q = query(
        collection(db, this.qrCodesCollection),
        where('batchId', '==', batchId)
      );
      const querySnapshot = await getDocs(q);
      
      const qrCodes = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        qrCodes.push({
          id: doc.id,
          ...data,
          expirationDate: data.expirationDate?.toDate ? data.expirationDate.toDate() : 
                         data.expirationDate instanceof Date ? data.expirationDate :
                         data.expirationDate ? new Date(data.expirationDate) : null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        });
      });

      return { success: true, qrCodes };
    } catch (error) {
      console.error('Error getting QR codes by batch:', error);
      return { success: false, message: error.message, qrCodes: [] };
    }
  }

  /**
   * Update QR code data
   * @param {string} qrCodeId - QR code ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - { success, message }
   */
  async updateQRCode(qrCodeId, updateData) {
    try {
      const qrCodeRef = doc(db, this.qrCodesCollection, qrCodeId);
      await updateDoc(qrCodeRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'QR code updated successfully' };
    } catch (error) {
      console.error('Error updating QR code:', error);
      return { success: false, message: error.message };
    }
  }
}

export const qrCodeService = new QRCodeService();

