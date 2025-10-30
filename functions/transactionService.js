const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const db = getFirestore();

/**
 * Get all transactions for a specific branch
 */
exports.getBranchTransactions = onRequest({ cors: true }, async (req, res) => {
  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    const { 
      branchId, 
      currentUserRole, 
      page = 1, 
      limit = 50, 
      search = '', 
      typeFilter = 'All', 
      statusFilter = 'All',
      lastDoc = null 
    } = req.body;

    // Validate input
    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }

    if (!currentUserRole) {
      return res.status(400).json({ error: 'Current user role is required' });
    }

    // Check if user has permission to view transactions
    const allowedRoles = ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'];
    if (!allowedRoles.includes(currentUserRole)) {
      return res.status(403).json({ error: 'Insufficient permissions to view transactions' });
    }

    console.log(`Fetching transactions for branchId=${branchId}, page=${page}, limit=${limit}`);

    // Build query with server-side filtering and pagination
    let transactionsQuery = db.collection('transactions')
      .where('branchId', '==', branchId);

    // Add type filter if specified
    if (typeFilter !== 'All') {
      transactionsQuery = transactionsQuery.where('transactionType', '==', typeFilter.toLowerCase());
    }

    // Add status filter if specified
    if (statusFilter !== 'All') {
      transactionsQuery = transactionsQuery.where('status', '==', statusFilter.toLowerCase());
    }

    // Order by creation date
    transactionsQuery = transactionsQuery.orderBy('createdAt', 'desc');

    // Apply pagination
    if (lastDoc) {
      const lastDocRef = db.collection('transactions').doc(lastDoc);
      const lastDocSnapshot = await lastDocRef.get();
      if (lastDocSnapshot.exists) {
        transactionsQuery = transactionsQuery.startAfter(lastDocSnapshot);
      }
    }

    // Limit results
    transactionsQuery = transactionsQuery.limit(limit);

    const transactionsSnapshot = await transactionsQuery.get();
    const transactions = [];

    console.log(`Found ${transactionsSnapshot.size} transactions in branch ${branchId}`);

    transactionsSnapshot.forEach((doc) => {
      const transactionData = doc.data();
      
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
      const transformedTransaction = {
        id: doc.id,
        type: transactionData.transactionType || 'service',
        customerName: transactionData.clientInfo?.name || 'Unknown Customer',
        serviceName: transactionData.services?.[0]?.serviceName || 'Service',
        stylistName: transactionData.services?.[0]?.stylistName || 'Unknown Stylist',
        appointmentId: transactionData.appointmentId || null,
        amount: transactionData.total || 0,
        commission: calculateCommission(transactionData.total || 0),
        status: mapTransactionStatus(transactionData.status),
        date: transactionData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        paymentMethod: transactionData.paymentMethod || 'Cash',
        duration: calculateDuration(transactionData.services || []),
        customerType: determineCustomerType(transactionData.clientInfo),
        satisfaction: 5, // Default satisfaction - could be added to transaction data
        items: transformServicesToItems(transactionData.services || []),
        // Additional fields from the transaction
        clientId: transactionData.clientId,
        clientInfo: transactionData.clientInfo,
        discount: transactionData.discount || 0,
        loyaltyEarned: transactionData.loyaltyEarned || 0,
        notes: transactionData.notes,
        subtotal: transactionData.subtotal || 0,
        tax: transactionData.tax || 0,
        total: transactionData.total || 0,
        transactionType: transactionData.transactionType,
        createdAt: transactionData.createdAt,
        updatedAt: transactionData.updatedAt
      };

      transactions.push(transformedTransaction);
    });

    // Get total count for pagination (this is expensive for large datasets)
    // For big data, consider using a separate counter or estimate
    let totalCount = transactions.length;
    if (page === 1) {
      // Only get total count on first page to avoid performance issues
      try {
        const countQuery = db.collection('transactions').where('branchId', '==', branchId);
        const countSnapshot = await countQuery.get();
        totalCount = countSnapshot.size;
      } catch (error) {
        console.warn('Could not get total count:', error);
        totalCount = transactions.length; // Fallback
      }
    }

    console.log(`Returning ${transactions.length} transactions (page ${page})`);

    res.status(200).json({
      success: true,
      transactions,
      count: transactions.length,
      totalCount,
      hasMore: transactions.length === limit,
      lastDoc: transactionsSnapshot.docs[transactionsSnapshot.docs.length - 1]?.id || null,
      page,
      limit
    });

  } catch (error) {
    console.error('Error getting branch transactions:', error);
    res.status(500).json({ error: 'Failed to get branch transactions: ' + error.message });
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
 */
function mapTransactionStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  };
  return statusMap[status] || 'Pending';
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
