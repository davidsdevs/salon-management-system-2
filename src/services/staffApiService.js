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

  // === Evaluations ===
  async addEvaluation(staffId, data, currentUserRole, branchId) {
    const res = await fetch(`${this.baseUrl}/addEvaluation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, data, currentUserRole, branchId })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add evaluation');
    return res.json();
  }

  async listEvaluations(staffId, currentUserRole) {
    const url = `${this.baseUrl}/listEvaluations?staffId=${encodeURIComponent(staffId)}&currentUserRole=${encodeURIComponent(currentUserRole || '')}`;
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to list evaluations');
    return res.json();
  }

  async deleteEvaluation(staffId, id, currentUserRole) {
    const res = await fetch(`${this.baseUrl}/deleteEvaluation`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, id, currentUserRole })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete evaluation');
    return res.json();
  }

  // === Certificates ===
  async addCertificate(staffId, data, currentUserRole) {
    const res = await fetch(`${this.baseUrl}/addCertificate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, data, currentUserRole })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add certificate');
    return res.json();
  }

  async listCertificates(staffId, currentUserRole) {
    const url = `${this.baseUrl}/listCertificates?staffId=${encodeURIComponent(staffId)}&currentUserRole=${encodeURIComponent(currentUserRole || '')}`;
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to list certificates');
    return res.json();
  }

  async deleteCertificate(staffId, id, currentUserRole) {
    const res = await fetch(`${this.baseUrl}/deleteCertificate`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, id, currentUserRole })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete certificate');
    return res.json();
  }

  // === Violations ===
  async addViolation(staffId, data, currentUserRole, branchId) {
    const res = await fetch(`${this.baseUrl}/addViolation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, data, currentUserRole, branchId })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add violation');
    return res.json();
  }

  async listViolations(staffId, currentUserRole) {
    const url = `${this.baseUrl}/listViolations?staffId=${encodeURIComponent(staffId)}&currentUserRole=${encodeURIComponent(currentUserRole || '')}`;
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to list violations');
    return res.json();
  }

  async deleteViolation(staffId, id, currentUserRole) {
    const res = await fetch(`${this.baseUrl}/deleteViolation`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, id, currentUserRole })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete violation');
    return res.json();
  }
}

export const staffApiService = new StaffApiService();
export default staffApiService;
