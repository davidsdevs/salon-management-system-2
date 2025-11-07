const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const db = getFirestore();

/**
 * Get all transactions for a specific branch
 * Using onCall for better Firebase integration and automatic CORS handling
 */
exports.getBranchTransactions = onCall(
  {
    region: 'us-central1',
    cors: true
  },
  async (request) => {
  try {
    const { 
      branchId, 
      currentUserRole, 
      page = 1, 
      limit = 50, 
      search = '', 
      typeFilter = 'All', 
      statusFilter = 'All',
      lastDoc = null 
    } = request.data;

    // Validate input
    if (!branchId) {
      throw new HttpsError('invalid-argument', 'Branch ID is required');
    }

    if (!currentUserRole) {
      throw new HttpsError('invalid-argument', 'Current user role is required');
    }

    // Check if user has permission to view transactions
    const allowedRoles = ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'];
    if (!allowedRoles.includes(currentUserRole)) {
      throw new HttpsError('permission-denied', 'Insufficient permissions to view transactions');
    }

    console.log(`Fetching transactions for branchId=${branchId}, page=${page}, limit=${limit}`);
    console.log(`Filters: typeFilter=${typeFilter}, statusFilter=${statusFilter}`);

    // Build query with server-side filtering and pagination
    // Strategy: Query without ordering to avoid index issues, then sort client-side
    // This ensures the query works even if composite indexes aren't created yet
    let transactionsQuery = db.collection('transactions')
      .where('branchId', '==', branchId);

    // Add type filter if specified
    if (typeFilter !== 'All' && typeFilter) {
      console.log(`Adding type filter: ${typeFilter.toLowerCase()}`);
      transactionsQuery = transactionsQuery.where('transactionType', '==', typeFilter.toLowerCase());
    }

    // Add status filter if specified
    // Map frontend display statuses to database status values
    if (statusFilter !== 'All' && statusFilter) {
      const statusMap = {
        'in service': 'in_service',
        'paid': 'paid',
        'voided': 'voided',
        'completed': 'paid', // Legacy: completed maps to paid
        'pending': 'in_service', // Legacy: pending maps to in_service
        'cancelled': 'voided', // Legacy: cancelled maps to voided
        'refunded': 'voided' // Legacy: refunded maps to voided
      };
      
      const statusLower = statusFilter.toLowerCase().trim();
      const dbStatus = statusMap[statusLower] || statusLower.replace(' ', '_'); // Fallback: replace space with underscore
      
      console.log(`Adding status filter: ${statusFilter} -> ${dbStatus}`);
      transactionsQuery = transactionsQuery.where('status', '==', dbStatus);
    }

    // Note: We're NOT using orderBy here to avoid composite index requirements
    // We'll sort client-side instead, which is more reliable
    // If you want server-side ordering, create composite indexes in Firestore

    // Apply pagination - Note: without orderBy, pagination won't work correctly
    // So we'll fetch more and paginate client-side
    // For initial testing, let's fetch a reasonable amount
    const fetchLimit = Math.min(limit * 3, 200); // Fetch up to 200 for client-side pagination
    transactionsQuery = transactionsQuery.limit(fetchLimit);
    
    console.log(`Query built, fetching up to ${fetchLimit} transactions`);

    let transactionsSnapshot;
    try {
      console.log('Executing Firestore query...');
      transactionsSnapshot = await transactionsQuery.get();
      console.log(`Query executed successfully. Found ${transactionsSnapshot.size} documents.`);
    } catch (queryError) {
      console.error('=== FIRESTORE QUERY ERROR ===');
      console.error('Error type:', queryError.constructor?.name);
      console.error('Error code:', queryError.code);
      console.error('Error message:', queryError.message);
      console.error('Error stack:', queryError.stack);
      
      // Check if it's an index error
      const errorMsg = queryError.message || '';
      const errorCode = queryError.code || '';
      
      if (errorMsg.includes('index') || errorCode === 'failed-precondition' || errorMsg.includes('requires an index')) {
        throw new HttpsError(
          'failed-precondition',
          `Required Firestore index is missing. The query requires a composite index. Error: ${errorMsg}. Please check the Firebase console for the index creation link.`
        );
      }
      
      // Provide more detailed error
      throw new HttpsError(
        'internal', 
        `Failed to query transactions. Error: ${errorMsg} (Code: ${errorCode}). Please check the function logs for more details.`
      );
    }
    
    const transactions = [];
    console.log(`Processing ${transactionsSnapshot.size} transaction documents...`);

    let processedCount = 0;
    let errorCount = 0;
    
    transactionsSnapshot.forEach((doc) => {
      try {
        const transactionData = doc.data();
        
        if (!transactionData) {
          console.warn(`Document ${doc.id} has no data, skipping`);
          errorCount++;
          return;
        }
        
        // Apply client-side search filter if needed
        if (search && search.trim() !== '') {
          const searchLower = search.toLowerCase();
          const customerName = transactionData.clientInfo?.name || '';
          const serviceName = transactionData.services?.[0]?.serviceName || '';
          const stylistName = transactionData.services?.[0]?.stylistName || '';
          const transactionId = doc.id;
          
          if (!customerName.toLowerCase().includes(searchLower) &&
              !serviceName.toLowerCase().includes(searchLower) &&
              !stylistName.toLowerCase().includes(searchLower) &&
              !transactionId.toLowerCase().includes(searchLower)) {
            return; // Skip this transaction if it doesn't match search
          }
        }
        
        // Transform the transaction data to match the frontend format
        // Handle createdAt date conversion
        let createdAtDate = null;
        if (transactionData.createdAt) {
          if (transactionData.createdAt.toDate) {
            createdAtDate = transactionData.createdAt.toDate();
          } else if (transactionData.createdAt.seconds) {
            createdAtDate = new Date(transactionData.createdAt.seconds * 1000);
          } else if (transactionData.createdAt instanceof Date) {
            createdAtDate = transactionData.createdAt;
          } else {
            createdAtDate = new Date(transactionData.createdAt);
          }
        }
        
        // Handle updatedAt date conversion
        let updatedAtDate = null;
        if (transactionData.updatedAt) {
          if (transactionData.updatedAt.toDate) {
            updatedAtDate = transactionData.updatedAt.toDate();
          } else if (transactionData.updatedAt.seconds) {
            updatedAtDate = new Date(transactionData.updatedAt.seconds * 1000);
          } else if (transactionData.updatedAt instanceof Date) {
            updatedAtDate = transactionData.updatedAt;
          } else {
            updatedAtDate = new Date(transactionData.updatedAt);
          }
        }
        
        const originalStatus = transactionData.status || 'in_service';
        const transformedTransaction = {
        id: doc.id,
        type: transactionData.transactionType || 'service',
        customerName: transactionData.clientInfo?.name || 'Unknown Customer',
        serviceName: transactionData.services?.[0]?.serviceName || 'Service',
        stylistName: transactionData.services?.[0]?.stylistName || 'Unknown Stylist',
        appointmentId: transactionData.appointmentId || null,
        amount: transactionData.total || transactionData.totalAmount || 0,
        commission: calculateCommission(transactionData.total || transactionData.totalAmount || 0),
        status: mapTransactionStatus(originalStatus), // Display-friendly status
        originalStatus: originalStatus, // Keep original for filtering
        date: createdAtDate ? createdAtDate.toISOString() : new Date().toISOString(),
        paymentMethod: transactionData.paymentMethod || 'Cash', // Handle null paymentMethod
        duration: calculateDuration(transactionData.services || []),
        customerType: determineCustomerType(transactionData.clientInfo),
        satisfaction: 5, // Default satisfaction - could be added to transaction data
        items: transformServicesToItems(transactionData.services || []),
        // Additional fields from the transaction
        branchId: transactionData.branchId,
        clientId: transactionData.clientId,
        clientInfo: transactionData.clientInfo || {},
        createdBy: transactionData.createdBy,
        discount: transactionData.discount || 0,
        loyaltyEarned: transactionData.loyaltyEarned || 0,
        notes: transactionData.notes || '',
        subtotal: transactionData.subtotal || 0,
        tax: transactionData.tax || 0,
        total: transactionData.total || transactionData.totalAmount || 0,
        totalAmount: transactionData.totalAmount || transactionData.total || 0,
        transactionType: transactionData.transactionType,
        services: transactionData.services || [],
        products: transactionData.products || [],
        createdAt: createdAtDate || transactionData.createdAt, // Keep both Date object and original
        updatedAt: updatedAtDate || transactionData.updatedAt // Keep both Date object and original
      };

        transactions.push(transformedTransaction);
        processedCount++;
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        console.error(`Document data:`, JSON.stringify(doc.data(), null, 2));
        errorCount++;
        // Continue processing other documents
      }
    });
    
    console.log(`Processed ${processedCount} transactions successfully, ${errorCount} errors`);

    // Always sort by createdAt client-side (descending - newest first)
    // This ensures consistent ordering without requiring composite indexes
    try {
      transactions.sort((a, b) => {
        try {
          // createdAt is already converted to Date object in transformation
          let aTime = a.createdAt instanceof Date ? a.createdAt : new Date(0);
          let bTime = b.createdAt instanceof Date ? b.createdAt : new Date(0);
          
          // Fallback: try to convert if not already a Date
          if (!(a.createdAt instanceof Date) && a.createdAt) {
            if (a.createdAt.toDate) {
              aTime = a.createdAt.toDate();
            } else if (a.createdAt.seconds) {
              aTime = new Date(a.createdAt.seconds * 1000);
            } else {
              aTime = new Date(a.createdAt);
            }
          }
          
          if (!(b.createdAt instanceof Date) && b.createdAt) {
            if (b.createdAt.toDate) {
              bTime = b.createdAt.toDate();
            } else if (b.createdAt.seconds) {
              bTime = new Date(b.createdAt.seconds * 1000);
            } else {
              bTime = new Date(b.createdAt);
            }
          }

          return bTime.getTime() - aTime.getTime(); // Descending order (newest first)
        } catch (sortError) {
          console.warn('Error sorting transaction:', sortError);
          return 0; // Keep original order if sorting fails
        }
      });
      console.log(`Sorted ${transactions.length} transactions by createdAt`);
    } catch (sortError) {
      console.error('Error during sort operation:', sortError);
      // Continue without sorting if it fails
    }

    // Apply pagination after sorting (client-side)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    // Get total count for pagination
    // Since we're doing client-side pagination, we need to get the total count
    // For performance, we only do this on the first page or if we fetched all results
    let totalCount = transactions.length;
    if (page === 1 || transactions.length < fetchLimit) {
      // If we got fewer results than requested, we have all results
      // Otherwise, try to get the total count (only on first page to avoid performance issues)
      try {
        const countQuery = db.collection('transactions').where('branchId', '==', branchId);
        const countSnapshot = await countQuery.get();
        totalCount = countSnapshot.size;
      } catch (error) {
        console.warn('Could not get total count, using fetched count:', error);
        // If we got all results in this fetch, use that as the count
        if (transactions.length < fetchLimit) {
          totalCount = transactions.length;
        }
      }
    }

    console.log(`Returning ${paginatedTransactions.length} transactions (page ${page} of ${Math.ceil(transactions.length / limit)})`);

    return {
      success: true,
      transactions: paginatedTransactions,
      count: paginatedTransactions.length,
      totalCount: transactions.length, // Use fetched count for now
      hasMore: endIndex < transactions.length,
      lastDoc: paginatedTransactions.length > 0 ? paginatedTransactions[paginatedTransactions.length - 1].id : null,
      page,
      limit
    };

  } catch (error) {
    console.error('=== ERROR IN getBranchTransactions ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Log request context for debugging
    console.error('Request context:', {
      branchId: request.data?.branchId,
      currentUserRole: request.data?.currentUserRole,
      page: request.data?.page,
      limit: request.data?.limit,
      typeFilter: request.data?.typeFilter,
      statusFilter: request.data?.statusFilter
    });
    
    if (error instanceof HttpsError) {
      // Re-throw HttpsError as-is (it already has proper error code and message)
      throw error;
    }
    
    // Provide more detailed error messages based on error type
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || 'unknown';
    
    // Check for specific error types
    if (errorMessage.includes('index') || errorCode === 'failed-precondition') {
      throw new HttpsError(
        'failed-precondition',
        `Missing Firestore index. The query requires a composite index. Error: ${errorMessage}. Please check the Firebase console for the index creation link.`
      );
    }
    
    if (errorMessage.includes('permission') || errorCode === 'permission-denied') {
      throw new HttpsError(
        'permission-denied',
        `Permission denied: ${errorMessage}`
      );
    }
    
    // For all other errors, provide detailed internal error
    throw new HttpsError(
      'internal', 
      `Failed to get branch transactions. Error: ${errorMessage} (Code: ${errorCode}). Please check the function logs for more details.`
    );
  }
});

/**
 * Helper function to calculate commission (15% of total)
 */
function calculateCommission(total) {
  return Math.round(total * 0.15 * 100) / 100;
}

/**
 * Helper function to map transaction status
 * Maps actual Firestore status values to display-friendly labels
 */
function mapTransactionStatus(status) {
  if (!status) return 'In Service';
  
  const statusLower = status.toLowerCase();
  const statusMap = {
    'in_service': 'In Service',
    'paid': 'Paid',
    'voided': 'Voided',
    // Legacy status mappings for backward compatibility
    'pending': 'In Service',
    'completed': 'Paid',
    'cancelled': 'Voided',
    'refunded': 'Voided'
  };
  return statusMap[statusLower] || status; // Return original if not found
}

/**
 * Helper function to calculate duration based on services
 */
function calculateDuration(services) {
  if (!services || services.length === 0) return '0 mins';
  
  // Sum up duration from services (assuming each service has a duration field)
  const totalDuration = services.reduce((sum, service) => {
    return sum + (service.duration || 0);
  }, 0);
  
  return totalDuration > 0 ? `${totalDuration} mins` : '30 mins'; // Default fallback
}

/**
 * Helper function to determine customer type
 */
function determineCustomerType(clientInfo) {
  if (!clientInfo) return 'New';
  
  // This could be enhanced with actual customer history
  // For now, we'll use a simple heuristic
  if (clientInfo.isVip) return 'VIP';
  if (clientInfo.isRegular) return 'Regular';
  return 'New';
}

/**
 * Helper function to transform services to items format
 */
function transformServicesToItems(services) {
  if (!services || services.length === 0) return [];
  
  return services.map(service => ({
    name: service.serviceName || 'Service',
    price: service.price || 0,
    quantity: 1
  }));
}
