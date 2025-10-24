import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

class TransactionService {
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @param {string} transactionType - Type of transaction ('service' or 'product')
   * @returns {Promise<string>} - Transaction ID
   */
  async createTransaction(transactionData, transactionType = 'service') {
    try {
      // Determine collection name based on transaction type
      const collectionName = transactionType === 'service' ? 'service_transactions' : 'product_transactions';
      
      console.log('Creating transaction with data:', transactionData);
      console.log('Client info in transaction data:', {
        clientId: transactionData.clientId,
        clientInfo: transactionData.clientInfo
      });
      
      const transactionRef = await addDoc(collection(db, collectionName), {
        ...transactionData,
        transactionType: transactionType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Transaction created with ID:', transactionRef.id);
      return transactionRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Get transactions by branch
   * @param {string} branchId - Branch ID
   * @param {Object} filters - Filter options
   * @param {string} transactionType - Type of transactions to fetch ('service', 'product', or 'all')
   * @returns {Promise<Array>} - Array of transactions
   */
  async getTransactionsByBranch(branchId, filters = {}, transactionType = 'all') {
    try {
      let allTransactions = [];
      
      // Fetch from service_transactions if needed
      if (transactionType === 'all' || transactionType === 'service') {
        let serviceQuery = query(
          collection(db, 'service_transactions'),
          where('branchId', '==', branchId)
        );

        // Apply date filter for service transactions (temporarily removed orderBy for index building)
        if (filters.startDate && filters.endDate) {
          serviceQuery = query(
            collection(db, 'service_transactions'),
            where('branchId', '==', branchId),
            where('createdAt', '>=', filters.startDate),
            where('createdAt', '<=', filters.endDate)
          );
        }

        // Apply status filter for service transactions (temporarily removed orderBy for index building)
        if (filters.status && filters.status !== 'all') {
          serviceQuery = query(
            collection(db, 'service_transactions'),
            where('branchId', '==', branchId),
            where('status', '==', filters.status)
          );
        }

        const serviceSnapshot = await getDocs(serviceQuery);
        const serviceTransactions = serviceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        allTransactions = [...allTransactions, ...serviceTransactions];
      }

      // Fetch from product_transactions if needed
      if (transactionType === 'all' || transactionType === 'product') {
        let productQuery = query(
          collection(db, 'product_transactions'),
          where('branchId', '==', branchId)
        );

        // Apply date filter for product transactions (temporarily removed orderBy for index building)
        if (filters.startDate && filters.endDate) {
          productQuery = query(
            collection(db, 'product_transactions'),
            where('branchId', '==', branchId),
            where('createdAt', '>=', filters.startDate),
            where('createdAt', '<=', filters.endDate)
          );
        }

        // Apply status filter for product transactions (temporarily removed orderBy for index building)
        if (filters.status && filters.status !== 'all') {
          productQuery = query(
            collection(db, 'product_transactions'),
            where('branchId', '==', branchId),
            where('status', '==', filters.status)
          );
        }

        const productSnapshot = await getDocs(productQuery);
        const productTransactions = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        allTransactions = [...allTransactions, ...productTransactions];
      }

      // Apply limit if specified
      if (filters.limit && filters.limit > 0) {
        allTransactions = allTransactions.slice(0, filters.limit);
      }
      
      // Sort by createdAt descending (newest first)
      return allTransactions.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Transaction data
   */
  async getTransactionById(transactionId) {
    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionSnap = await getDoc(transactionRef);
      
      if (transactionSnap.exists()) {
        return {
          id: transactionSnap.id,
          ...transactionSnap.data()
        };
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error('Failed to fetch transaction');
    }
  }

  /**
   * Update transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} updateData - Update data
   * @param {string} transactionType - Type of transaction ('service' or 'product')
   * @returns {Promise<void>}
   */
  async updateTransaction(transactionId, updateData, transactionType = 'service') {
    try {
      // Determine collection name based on transaction type
      const collectionName = transactionType === 'service' ? 'service_transactions' : 'product_transactions';
      
      const transactionRef = doc(db, collectionName, transactionId);
      await updateDoc(transactionRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  /**
   * Void/Refund transaction
   * @param {string} transactionId - Transaction ID
   * @param {string} reason - Reason for void/refund
   * @param {string} userId - User ID who performed the action
   * @returns {Promise<void>}
   */
  async voidTransaction(transactionId, reason, userId) {
    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      await updateDoc(transactionRef, {
        status: 'voided',
        voidReason: reason,
        voidedBy: userId,
        voidedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error voiding transaction:', error);
      throw new Error('Failed to void transaction');
    }
  }

  /**
   * Get transactions by client
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} - Array of transactions
   */
  async getTransactionsByClient(clientId) {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching client transactions:', error);
      throw new Error('Failed to fetch client transactions');
    }
  }

  /**
   * Get daily sales summary
   * @param {string} branchId - Branch ID
   * @param {Date} date - Date for summary
   * @returns {Promise<Object>} - Sales summary
   */
  async getDailySalesSummary(branchId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      let allTransactions = [];

      // Fetch from service_transactions (temporarily simplified query for index building)
      const serviceQuery = query(
        collection(db, 'service_transactions'),
        where('branchId', '==', branchId),
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<=', endOfDay),
        where('status', '==', 'completed')
      );

      const serviceSnapshot = await getDocs(serviceQuery);
      const serviceTransactions = serviceSnapshot.docs.map(doc => doc.data());

      // Fetch from product_transactions (temporarily simplified query for index building)
      const productQuery = query(
        collection(db, 'product_transactions'),
        where('branchId', '==', branchId),
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<=', endOfDay),
        where('status', '==', 'completed')
      );

      const productSnapshot = await getDocs(productQuery);
      const productTransactions = productSnapshot.docs.map(doc => doc.data());

      allTransactions = [...serviceTransactions, ...productTransactions];

      const summary = {
        totalTransactions: allTransactions.length,
        totalRevenue: allTransactions.reduce((sum, t) => sum + (t.total || 0), 0),
        totalDiscounts: allTransactions.reduce((sum, t) => sum + (t.discount || 0), 0),
        totalTax: allTransactions.reduce((sum, t) => sum + (t.tax || 0), 0),
        averageTransaction: allTransactions.length > 0 ? 
          allTransactions.reduce((sum, t) => sum + (t.total || 0), 0) / allTransactions.length : 0,
        paymentMethods: this.getPaymentMethodSummary(allTransactions)
      };

      return summary;
    } catch (error) {
      console.error('Error fetching daily sales summary:', error);
      throw new Error('Failed to fetch daily sales summary');
    }
  }

  /**
   * Get payment method summary
   * @param {Array} transactions - Array of transactions
   * @returns {Object} - Payment method breakdown
   */
  getPaymentMethodSummary(transactions) {
    const methods = {};
    transactions.forEach(transaction => {
      const method = transaction.paymentMethod || 'unknown';
      methods[method] = (methods[method] || 0) + 1;
    });
    return methods;
  }

  /**
   * Calculate transaction totals
   * @param {Array} items - Array of items
   * @param {number} discount - Discount amount
   * @param {number} taxRate - Tax rate (percentage)
   * @returns {Object} - Calculated totals
   */
  calculateTotals(items, discount = 0, taxRate = 0) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * (item.quantity || 1));
    }, 0);

    const discountAmount = discount;
    const taxableAmount = subtotal - discountAmount;
    const tax = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + tax;

    return {
      subtotal,
      discount: discountAmount,
      tax,
      total
    };
  }

  /**
   * Generate receipt data
   * @param {Object} transaction - Transaction data
   * @returns {Object} - Receipt data
   */
  generateReceiptData(transaction) {
    return {
      receiptId: transaction.id,
      branchId: transaction.branchId,
      clientId: transaction.clientId,
      items: transaction.items || [],
      subtotal: transaction.subtotal || 0,
      discount: transaction.discount || 0,
      tax: transaction.tax || 0,
      total: transaction.total || 0,
      paymentMethod: transaction.paymentMethod || 'cash',
      status: transaction.status || 'completed',
      createdAt: transaction.createdAt,
      loyaltyUsed: transaction.loyaltyUsed || 0,
      loyaltyEarned: transaction.loyaltyEarned || 0
    };
  }

  /**
   * Update client loyalty points
   * @param {string} clientId - Client ID
   * @param {number} pointsEarned - Points earned
   * @param {number} pointsUsed - Points used
   * @returns {Promise<void>}
   */
  async updateClientLoyaltyPoints(clientId, pointsEarned, pointsUsed) {
    try {
      // This would integrate with the client service
      // For now, we'll just log the action
      console.log(`Updating loyalty points for client ${clientId}: +${pointsEarned}, -${pointsUsed}`);
    } catch (error) {
      console.error('Error updating loyalty points:', error);
      throw new Error('Failed to update loyalty points');
    }
  }

  /**
   * Deduct inventory for products
   * @param {Array} items - Array of items with product information
   * @returns {Promise<void>}
   */
  async deductInventory(items) {
    try {
      const batch = writeBatch(db);
      
      // Filter only product items
      const productItems = items.filter(item => item.type === 'product');
      
      for (const item of productItems) {
        if (item.productId && item.quantity) {
          const productRef = doc(db, 'products', item.productId);
          // This would need to be implemented with the inventory service
          console.log(`Deducting ${item.quantity} of product ${item.productId}`);
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error deducting inventory:', error);
      throw new Error('Failed to deduct inventory');
    }
  }
}

export const transactionService = new TransactionService();
export default transactionService;
