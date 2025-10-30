import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

class ScheduleService {
  constructor() {
    this.db = db;
    this.collection = 'schedules';
  }

  // Get all schedules for a branch
  async getSchedulesByBranch(branchId) {
    try {
      const q = query(
        collection(this.db, this.collection),
        where('branchId', '==', branchId)
      );

      const snapshot = await getDocs(q);
      const schedules = [];
      
      snapshot.forEach((doc) => {
        schedules.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort client-side if needed
      return schedules.sort((a, b) => {
        if (a.employeeId !== b.employeeId) {
          return a.employeeId.localeCompare(b.employeeId);
        }
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
      });
    } catch (error) {
      console.error('Error getting schedules by branch:', error);
      throw error;
    }
  }

  // Get schedule for a specific employee
  async getScheduleByEmployee(employeeId) {
    try {
      const q = query(
        collection(this.db, this.collection),
        where('employeeId', '==', employeeId)
      );

      const snapshot = await getDocs(q);
      const schedules = [];
      
      snapshot.forEach((doc) => {
        schedules.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by day of week
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return schedules.sort((a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek));
    } catch (error) {
      console.error('Error getting schedule by employee:', error);
      throw error;
    }
  }

  // Create or update a schedule
  async upsertSchedule(scheduleData) {
    try {
      // Check if schedule already exists for this employee and day
      const existingQuery = query(
        collection(this.db, this.collection),
        where('employeeId', '==', scheduleData.employeeId),
        where('dayOfWeek', '==', scheduleData.dayOfWeek),
        where('branchId', '==', scheduleData.branchId)
      );

      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        // Update existing schedule
        const existingDoc = existingSnapshot.docs[0];
        await updateDoc(doc(this.db, this.collection, existingDoc.id), {
          ...scheduleData,
          updatedAt: serverTimestamp()
        });
        return { id: existingDoc.id, ...scheduleData };
      } else {
        // Create new schedule
        const docRef = await addDoc(collection(this.db, this.collection), {
          ...scheduleData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...scheduleData };
      }
    } catch (error) {
      console.error('Error upserting schedule:', error);
      throw error;
    }
  }

  // Bulk create schedules for an employee (e.g., MWF 9am-6pm)
  async createWeeklySchedule(employeeId, branchId, weekSchedule) {
    try {
      const results = [];
      
      for (const daySchedule of weekSchedule) {
        const scheduleData = {
          employeeId,
          branchId,
          dayOfWeek: daySchedule.dayOfWeek, // e.g., "Monday", "Wednesday", "Friday"
          startTime: daySchedule.startTime, // e.g., "09:00"
          endTime: daySchedule.endTime, // e.g., "18:00"
          notes: daySchedule.notes || ''
        };
        
        const result = await this.upsertSchedule(scheduleData);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Error creating weekly schedule:', error);
      throw error;
    }
  }

  // Delete a schedule
  async deleteSchedule(scheduleId) {
    try {
      await deleteDoc(doc(this.db, this.collection, scheduleId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  // Delete all schedules for an employee
  async deleteEmployeeSchedules(employeeId) {
    try {
      const q = query(
        collection(this.db, this.collection),
        where('employeeId', '==', employeeId)
      );

      const snapshot = await getDocs(q);
      const deletePromises = [];
      
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      console.error('Error deleting employee schedules:', error);
      throw error;
    }
  }

  // Delete schedules for a specific day
  async deleteSchedulesByDay(employeeId, dayOfWeek) {
    try {
      const q = query(
        collection(this.db, this.collection),
        where('employeeId', '==', employeeId),
        where('dayOfWeek', '==', dayOfWeek)
      );

      const snapshot = await getDocs(q);
      const deletePromises = [];
      
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      console.error('Error deleting schedules by day:', error);
      throw error;
    }
  }
}

export const scheduleService = new ScheduleService();
