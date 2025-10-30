import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

const getBranchTransactionsCallable = httpsCallable(functions, 'getBranchTransactions');

class TransactionApiService {
  /**
   * Get all transactions for a specific branch with pagination and filtering
   * @param {string} branchId - The branch ID to fetch transactions for
   * @param {string} currentUserRole - The current user's role
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>} - Response with success status and transactions array
   */
  async getBranchTransactions(branchId, currentUserRole, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        typeFilter = 'All',
        statusFilter = 'All',
        lastDoc = null
      } = options;

      const response = await getBranchTransactionsCallable({ 
        branchId, 
        currentUserRole,
        page,
        limit,
        search,
        typeFilter,
        statusFilter,
        lastDoc
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching branch transactions:', error);
      return { 
        success: false, 
        error: error.message,
        transactions: [],
        count: 0,
        totalCount: 0,
        hasMore: false
      };
    }
  }
}

export const transactionApiService = new TransactionApiService();
