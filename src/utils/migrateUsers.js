// Migration script to update existing users to the new multiple roles structure
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const migrateUsersToNewStructure = async () => {
  try {
    console.log('Starting user migration...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let migratedCount = 0;
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      
      // Check if user needs migration (has old structure)
      if (userData.role && !userData.roles) {
        console.log(`Migrating user: ${userData.email}`);
        
        // Update user with new structure
        await updateDoc(doc(db, 'users', userDoc.id), {
          roles: [userData.role], // Convert single role to array
          primaryRole: userData.role, // Set primary role
          currentRole: userData.role, // Set current role
          updatedAt: new Date()
        });
        
        migratedCount++;
        console.log(`✅ Migrated user: ${userData.email} (${userData.role})`);
      }
    }
    
    console.log(`Migration complete! Migrated ${migratedCount} users.`);
    return { success: true, migratedCount };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};

// Function to run migration from browser console
window.migrateUsers = migrateUsersToNewStructure;

