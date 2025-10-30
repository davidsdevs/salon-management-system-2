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

// Transaction Status Constants
export const TRANSACTION_STATUS = {
  IN_SERVICE: 'in_service',
  PAID: 'paid',
  VOIDED: 'voided'
};

class TransactionService {
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
     * @returns {Promise<string>} - Transaction ID
   */
  async createTransaction(transactionData) {
    try {
      console.log('Creating transaction with data:', transactionData);
      console.log('Client info in transaction data:', {
        clientId: transactionData.clientId,
        clientInfo: transactionData.clientInfo
      });
      
      const transactionRef = await addDoc(collection(db, 'transactions'), {
        ...transactionData,
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
   * @returns {Promise<Array>} - Array of transactions
   */
  async getTransactionsByBranch(branchId, filters = {}) {
    try {
      const { limit: limitCount = 50, status, transactionType } = filters;
      
      let q = query(
        collection(db, 'transactions'),
        where('branchId', '==', branchId)
      );
      
      // Add status filter if provided
      if (status && status !== 'all') {
        q = query(q, where('status', '==', status));
      }
      
      // Add transaction type filter if provided
      if (transactionType && transactionType !== 'all') {
        q = query(q, where('transactionType', '==', transactionType));
      }
      
      // Add ordering and limit (temporarily disabled while indexes build)
      // q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));
      q = query(q, limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Client-side sorting by createdAt (desc) since orderBy is temporarily disabled
      transactions.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bTime - aTime; // Descending order
      });
      
      return transactions;
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
   * @returns {Promise<void>}
   */
  async updateTransaction(transactionId, updateData) {
    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      
      // Get the transaction to check if it has an appointmentId
      const transactionDoc = await getDoc(transactionRef);
      const transactionData = transactionDoc.data();
      
      await updateDoc(transactionRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // If transaction is being marked as paid
      if (updateData.status === TRANSACTION_STATUS.PAID) {
        const clientId = transactionData.clientId;
        
        // 1. Add loyalty points (configurable per branch)
        // NOTE: Only PRODUCT transactions earn loyalty points, SERVICE transactions do not
        if (clientId && transactionData.total && transactionData.branchId && transactionData.transactionType === 'product') {
          try {
            const { clientService } = await import('./clientService');
            const { branchService } = await import('./branchService');
            
            // Get branch configuration for loyalty points
            const branch = await branchService.getBranch(transactionData.branchId);
            const loyaltyConfig = branch?.loyaltyPointsConfig || { enabled: true, amountPerPoint: 100 };
            
            // Only add points if loyalty program is enabled for this branch
            if (loyaltyConfig.enabled) {
              const amountPerPoint = loyaltyConfig.amountPerPoint || 100;
              const pointsToAdd = Math.floor(transactionData.total / amountPerPoint);
              
              if (pointsToAdd > 0) {
                await clientService.addLoyaltyPoints(clientId, pointsToAdd, transactionData.branchId);
                console.log(`Added ${pointsToAdd} loyalty points to client ${clientId} for branch ${transactionData.branchId} (₱${amountPerPoint} = 1 point)`);
              } else {
                console.log(`Transaction total (₱${transactionData.total}) is below minimum for points (₱${amountPerPoint} = 1 point)`);
              }
            } else {
              console.log(`Loyalty points disabled for branch ${transactionData.branchId}`);
            }
          } catch (loyaltyError) {
            console.error('Error adding loyalty points:', loyaltyError);
          }
        } else if (clientId && transactionData.transactionType === 'service') {
          console.log(`Service transactions do not earn loyalty points (Transaction type: ${transactionData.transactionType})`);
        }
        
        // 2. Add service history entry
        if (clientId) {
          try {
            const { clientService } = await import('./clientService');
            await clientService.addServiceHistory(clientId, {
              appointmentId: transactionData.appointmentId || null,
              date: serverTimestamp(),
              services: transactionData.services || [],
              products: transactionData.products || [],
              stylist: transactionData.services?.[0]?.stylistName || 'Staff',
              totalAmount: transactionData.total || 0,
              paymentMethod: updateData.paymentMethod || transactionData.paymentMethod,
              transactionId: transactionId
            });
            console.log(`Added service history for client ${clientId}`);
          } catch (historyError) {
            console.error('Error adding service history:', historyError);
          }
        }
        
        // 3. Mark appointment as completed (if linked)
        if (transactionData?.appointmentId) {
          try {
            const { appointmentService, APPOINTMENT_STATUS } = await import('./appointmentService');
            await appointmentService.updateAppointmentStatus(
              transactionData.appointmentId, 
              APPOINTMENT_STATUS.COMPLETED,
              transactionData.createdBy || 'system'
            );
            console.log(`Appointment ${transactionData.appointmentId} marked as completed after payment`);
          } catch (appointmentError) {
            console.error('Error updating appointment status:', appointmentError);
          }
        }
      }
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
  async voidTransaction(transactionId, reason, notes, userId) {
    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      // Check if transaction can be voided (only pending or completed transactions)
      if (transactionData.status === TRANSACTION_STATUS.VOIDED) {
        throw new Error('Transaction is already voided');
      }

      // If transaction was paid and had loyalty points, reverse them
      if (transactionData.status === TRANSACTION_STATUS.PAID && 
          transactionData.clientId && 
          transactionData.transactionType === 'product' &&
          transactionData.loyaltyPointsEarned > 0) {
        try {
          const { clientService } = await import('./clientService');
          await clientService.deductLoyaltyPoints(
            transactionData.clientId, 
            transactionData.loyaltyPointsEarned,
            transactionData.branchId
          );
        } catch (pointsError) {
          console.warn('Failed to reverse loyalty points:', pointsError);
        }
      }

      // TODO: If transaction had inventory deductions, reverse them
      // This will be implemented when inventoryService is available
      if (transactionData.status === TRANSACTION_STATUS.PAID && 
          transactionData.products && 
          transactionData.products.length > 0) {
        console.log('Note: Inventory reversal not yet implemented. Products in voided transaction:', 
          transactionData.products.map(p => `${p.productName} (Qty: ${p.quantity})`).join(', ')
        );
      }

      // Update transaction to voided status
      await updateDoc(transactionRef, {
        status: TRANSACTION_STATUS.VOIDED,
        voidReason: reason,
        voidNotes: notes || '',
        voidedBy: userId,
        voidedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error voiding transaction:', error);
      throw error;
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

      // Fetch from transactions collection
      const q = query(
        collection(db, 'transactions'),
        where('branchId', '==', branchId),
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<=', endOfDay),
        where('status', '==', 'completed')
      );

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map(doc => doc.data());

      const summary = {
        totalTransactions: transactions.length,
        totalRevenue: transactions.reduce((sum, t) => sum + (t.total || 0), 0),
        totalDiscounts: transactions.reduce((sum, t) => sum + (t.discount || 0), 0),
        totalTax: transactions.reduce((sum, t) => sum + (t.tax || 0), 0),
        averageTransaction: transactions.length > 0 ? 
          transactions.reduce((sum, t) => sum + (t.total || 0), 0) / transactions.length : 0,
        paymentMethods: this.getPaymentMethodSummary(transactions)
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
