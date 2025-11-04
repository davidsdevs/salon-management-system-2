import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

class RolePinService {
  /**
   * Hash a PIN for secure storage
   */
  async hashPin(pin) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pin, salt);
  }

  /**
   * Verify a PIN against the stored hash
   */
  async verifyPin(pin, hashedPin) {
    return bcrypt.compare(pin, hashedPin);
  }

  /**
   * Get user's role PINs
   */
  async getRolePins(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      return userDoc.data().rolePins || {};
    } catch (error) {
      console.error('Error getting role PINs:', error);
      throw error;
    }
  }

  /**
   * Verify a role PIN for a user
   */
  async verifyRolePin(userId, role, pin) {
    try {
      const rolePins = await this.getRolePins(userId);
      const hashedPin = rolePins[role];

      if (!hashedPin) {
        // If no PIN is set for this role, allow access (backward compatibility)
        return true;
      }

      return await this.verifyPin(pin, hashedPin);
    } catch (error) {
      console.error('Error verifying role PIN:', error);
      throw error;
    }
  }

  /**
   * Set a PIN for a specific role
   */
  async setRolePin(userId, role, pin) {
    try {
      // Validate PIN
      if (!/^\d{4}$/.test(pin)) {
        throw new Error('PIN must be exactly 4 digits');
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const hashedPin = await this.hashPin(pin);
      const currentRolePins = userDoc.data().rolePins || {};

      await updateDoc(userRef, {
        rolePins: {
          ...currentRolePins,
          [role]: hashedPin
        }
      });

      return true;
    } catch (error) {
      console.error('Error setting role PIN:', error);
      throw error;
    }
  }

  /**
   * Remove PIN for a specific role
   */
  async removeRolePin(userId, role) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentRolePins = userDoc.data().rolePins || {};
      delete currentRolePins[role];

      await updateDoc(userRef, {
        rolePins: currentRolePins
      });

      return true;
    } catch (error) {
      console.error('Error removing role PIN:', error);
      throw error;
    }
  }

  /**
   * Check if a role has a PIN set
   */
  async hasRolePin(userId, role) {
    try {
      const rolePins = await this.getRolePins(userId);
      return !!rolePins[role];
    } catch (error) {
      console.error('Error checking role PIN:', error);
      return false;
    }
  }
}

export default new RolePinService();
