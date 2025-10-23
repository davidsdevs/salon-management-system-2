import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

class ServiceService {
  async getServiceById(serviceId) {
    try {
      const serviceDoc = await getDoc(doc(db, 'services', serviceId));
      if (serviceDoc.exists()) {
        return serviceDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  }

  async getAllServices() {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const servicesSnapshot = await getDocs(collection(db, 'services'));
      const services = [];
      servicesSnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() });
      });
      return services;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async getServicesByBranch(branchId) {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const servicesQuery = query(
        collection(db, 'services'),
        where('branches', 'array-contains', branchId)
      );
      const servicesSnapshot = await getDocs(servicesQuery);
      const services = [];
      servicesSnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() });
      });
      return services;
    } catch (error) {
      console.error('Error fetching services by branch:', error);
      throw error;
    }
  }
}

export const serviceService = new ServiceService();
