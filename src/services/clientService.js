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

class ClientService {
  constructor() {
    this.collection = 'users'; // Using existing users collection
  }

  /**
   * Create a new client profile
   * @param {Object} clientData - Client data
   * @returns {Promise<string>} - Client ID
   */
  async createClient(clientData) {
    try {
      // Generate referral code for new client
      const referralCode = this.generateReferralCode();
      
      const clientRef = await addDoc(collection(db, this.collection), {
        ...clientData,
        roles: ['client'], // Set role as client
        referralCode,
        loyaltyPoints: 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Client created with ID:', clientRef.id);
      return clientRef.id;
    } catch (error) {
      console.error('Error creating client:', error);
      throw new Error('Failed to create client');
    }
  }

  /**
   * Get client by ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} - Client data
   */
  async getClientById(clientId) {
    try {
      const clientDoc = await getDoc(doc(db, this.collection, clientId));
      
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }
      
      return {
        id: clientDoc.id,
        ...clientDoc.data()
      };
    } catch (error) {
      console.error('Error getting client:', error);
      throw error;
    }
  }

  /**
   * Get all clients by branch
   * NOTE: Clients are NOT tied to specific branches - they can book at any branch
   * This method now returns ALL clients regardless of branchId parameter
   * @param {string} branchId - Branch ID (optional, not used for filtering)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of clients
   */
  async getClientsByBranch(branchId, filters = {}) {
    try {
      // Get ALL clients (not filtered by branch)
      // Clients can book at any branch, so they don't have a fixed branchId
      let q = query(
        collection(db, this.collection),
        where('roles', 'array-contains', 'client') // Filter only users with client role
      );
      
      const querySnapshot = await getDocs(q);
      let clients = [];
      
      querySnapshot.forEach((doc) => {
        clients.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Client-side status filtering
      if (filters.status && filters.status !== 'all') {
        clients = clients.filter(c => c.status === filters.status);
      }
      
      // Client-side sorting by name
      clients.sort((a, b) => {
        const nameA = (a.firstName + ' ' + a.lastName)?.toLowerCase() || a.name?.toLowerCase() || '';
        const nameB = (b.firstName + ' ' + b.lastName)?.toLowerCase() || b.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
      
      return clients;
    } catch (error) {
      console.error('Error getting clients:', error);
      throw new Error('Failed to get clients');
    }
  }

  /**
   * Get all clients (for system admin/operational manager)
   * @returns {Promise<Array>} - Array of all clients
   */
  async getAllClients() {
    try {
      const q = query(
        collection(db, this.collection),
        where('roles', 'array-contains', 'client')
      );
      
      const querySnapshot = await getDocs(q);
      const clients = [];
      
      querySnapshot.forEach((doc) => {
        clients.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return clients;
    } catch (error) {
      console.error('Error getting all clients:', error);
      throw new Error('Failed to get clients');
    }
  }

  /**
   * Update client profile
   * @param {string} clientId - Client ID
   * @param {Object} updateData - Update data
   * @returns {Promise<void>}
   */
  async updateClient(clientId, updateData) {
    try {
      const clientRef = doc(db, this.collection, clientId);
      await updateDoc(clientRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error('Failed to update client');
    }
  }

  /**
   * Add loyalty points to client (tracked per branch)
   * @param {string} clientId - Client ID
   * @param {number} points - Points to add
   * @param {string} branchId - Branch ID where points were earned
   * @returns {Promise<void>}
   */
  async addLoyaltyPoints(clientId, points, branchId = null) {
    try {
      const clientDoc = await getDoc(doc(db, this.collection, clientId));
      
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }
      
      const clientData = clientDoc.data();
      
      // Get current points by branch
      const loyaltyPointsByBranch = clientData.loyaltyPointsByBranch || {};
      const currentBranchPoints = loyaltyPointsByBranch[branchId] || 0;
      const newBranchPoints = currentBranchPoints + points;
      
      // Update branch-specific points
      loyaltyPointsByBranch[branchId] = newBranchPoints;
      
      // Calculate total points across all branches
      const totalPoints = Object.values(loyaltyPointsByBranch).reduce((sum, pts) => sum + pts, 0);
      
      await updateDoc(doc(db, this.collection, clientId), {
        loyaltyPointsByBranch: loyaltyPointsByBranch,
        loyaltyPoints: totalPoints, // Keep global total for backward compatibility
        updatedAt: serverTimestamp()
      });
      
      console.log(`Added ${points} loyalty points to client ${clientId} for branch ${branchId}. Branch total: ${newBranchPoints}, Global total: ${totalPoints}`);
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      throw error;
    }
  }

  /**
   * Redeem loyalty points (from specific branch)
   * @param {string} clientId - Client ID
   * @param {number} points - Points to redeem
   * @param {string} branchId - Branch ID where points will be redeemed
   * @returns {Promise<void>}
   */
  async redeemLoyaltyPoints(clientId, points, branchId = null) {
    try {
      const clientDoc = await getDoc(doc(db, this.collection, clientId));
      
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }
      
      const clientData = clientDoc.data();
      const loyaltyPointsByBranch = clientData.loyaltyPointsByBranch || {};
      const currentBranchPoints = loyaltyPointsByBranch[branchId] || 0;
      
      if (currentBranchPoints < points) {
        throw new Error(`Insufficient loyalty points for this branch. Available: ${currentBranchPoints}, Required: ${points}`);
      }
      
      const newBranchPoints = currentBranchPoints - points;
      
      // Update branch-specific points
      loyaltyPointsByBranch[branchId] = newBranchPoints;
      
      // Calculate total points across all branches
      const totalPoints = Object.values(loyaltyPointsByBranch).reduce((sum, pts) => sum + pts, 0);
      
      await updateDoc(doc(db, this.collection, clientId), {
        loyaltyPointsByBranch: loyaltyPointsByBranch,
        loyaltyPoints: totalPoints, // Update global total
        updatedAt: serverTimestamp()
      });
      
      console.log(`Redeemed ${points} loyalty points from client ${clientId} at branch ${branchId}. Branch remaining: ${newBranchPoints}, Global total: ${totalPoints}`);
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      throw error;
    }
  }

  /**
   * Get loyalty points for specific branch
   * @param {string} clientId - Client ID
   * @param {string} branchId - Branch ID
   * @returns {Promise<number>} - Points for that branch
   */
  async getBranchLoyaltyPoints(clientId, branchId) {
    try {
      const clientDoc = await getDoc(doc(db, this.collection, clientId));
      
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }
      
      const clientData = clientDoc.data();
      const loyaltyPointsByBranch = clientData.loyaltyPointsByBranch || {};
      
      return loyaltyPointsByBranch[branchId] || 0;
    } catch (error) {
      console.error('Error getting branch loyalty points:', error);
      throw error;
    }
  }

  /**
   * Get all loyalty points by branch
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} - Object with branchId as key and points as value
   */
  async getAllBranchLoyaltyPoints(clientId) {
    try {
      const clientDoc = await getDoc(doc(db, this.collection, clientId));
      
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }
      
      const clientData = clientDoc.data();
      return clientData.loyaltyPointsByBranch || {};
    } catch (error) {
      console.error('Error getting all branch loyalty points:', error);
      throw error;
    }
  }

  /**
   * Add service history entry
   * @param {string} clientId - Client ID
   * @param {Object} historyData - Service history data
   * @returns {Promise<string>} - History ID
   */
  async addServiceHistory(clientId, historyData) {
    try {
      const historyRef = await addDoc(
        collection(db, this.collection, clientId, 'history'),
        {
          ...historyData,
          createdAt: serverTimestamp()
        }
      );
      
      return historyRef.id;
    } catch (error) {
      console.error('Error adding service history:', error);
      throw new Error('Failed to add service history');
    }
  }

  /**
   * Get client service history
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} - Array of service history
   */
  async getServiceHistory(clientId) {
    try {
      const historySnapshot = await getDocs(
        collection(db, this.collection, clientId, 'history')
      );
      
      const history = [];
      historySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by date (most recent first)
      history.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
      
      return history;
    } catch (error) {
      console.error('Error getting service history:', error);
      throw new Error('Failed to get service history');
    }
  }

  /**
   * Update service history entry (e.g., add rating/feedback)
   * @param {string} clientId - Client ID
   * @param {string} historyId - History entry ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateServiceHistory(clientId, historyId, updateData) {
    try {
      const historyRef = doc(db, this.collection, clientId, 'history', historyId);
      await updateDoc(historyRef, updateData);
      console.log(`Updated service history ${historyId} for client ${clientId}`);
    } catch (error) {
      console.error('Error updating service history:', error);
      throw new Error('Failed to update service history');
    }
  }

  /**
   * Search clients by name or phone
   * @param {string} searchTerm - Search term
   * @param {string} branchId - Branch ID (optional)
   * @returns {Promise<Array>} - Array of matching clients
   */
  async searchClients(searchTerm, branchId = null) {
    try {
      let clients = branchId 
        ? await this.getClientsByBranch(branchId)
        : await this.getAllClients();
      
      const lowerSearch = searchTerm.toLowerCase();
      
      return clients.filter(client => {
        const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
        return fullName.includes(lowerSearch) ||
          client.phone?.includes(searchTerm) ||
          client.email?.toLowerCase().includes(lowerSearch);
      });
    } catch (error) {
      console.error('Error searching clients:', error);
      throw new Error('Failed to search clients');
    }
  }

  /**
   * Generate unique referral code
   * @returns {string} - Referral code
   */
  generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Deactivate client
   * @param {string} clientId - Client ID
   * @returns {Promise<void>}
   */
  async deactivateClient(clientId) {
    try {
      await updateDoc(doc(db, this.collection, clientId), {
        status: 'inactive',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deactivating client:', error);
      throw new Error('Failed to deactivate client');
    }
  }

  /**
   * Activate client
   * @param {string} clientId - Client ID
   * @returns {Promise<void>}
   */
  async activateClient(clientId) {
    try {
      await updateDoc(doc(db, this.collection, clientId), {
        status: 'active',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error activating client:', error);
      throw new Error('Failed to activate client');
    }
  }
}

// Export singleton instance
export const clientService = new ClientService();
export default clientService;
