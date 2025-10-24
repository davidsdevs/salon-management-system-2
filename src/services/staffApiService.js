import { getFunctions } from 'firebase/functions';

const functions = getFunctions();

class StaffApiService {
  constructor() {
    this.functions = functions;
    this.baseUrl = 'https://us-central1-david-salon-fff6d.cloudfunctions.net';
  }

  /**
   * Get all staff (branch managers and stylists) for a specific branch
   */
  async getBranchStaff(branchId, currentUserRole) {
    try {
      const response = await fetch(`${this.baseUrl}/getBranchStaff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branchId,
          currentUserRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get branch staff');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting branch staff:', error);
      throw error;
    }
  }

  /**
   * Get all available services from the services collection
   */
  async getAllServices(currentUserRole) {
    try {
      const response = await fetch(`${this.baseUrl}/getAllServices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentUserRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get services');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting services:', error);
      throw error;
    }
  }

  /**
   * Update staff member's assigned services
   */
  async updateStaffServices(staffId, services, currentUserRole, currentUserId) {
    try {
      const response = await fetch(`${this.baseUrl}/updateStaffServices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId,
          services,
          currentUserRole,
          currentUserId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update staff services');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating staff services:', error);
      throw error;
    }
  }

  /**
   * Get staff member details with their assigned services
   */
  async getStaffDetails(staffId, currentUserRole, currentUserId) {
    try {
      const response = await fetch(`${this.baseUrl}/getStaffDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId,
          currentUserRole,
          currentUserId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get staff details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting staff details:', error);
      throw error;
    }
  }
}

export const staffApiService = new StaffApiService();
export default staffApiService;
