const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const cors = require('cors')({ origin: true });

const db = getFirestore();

/**
 * Get all staff (branch managers and stylists) for a specific branch
 */
exports.getBranchStaff = onRequest({ cors: true }, async (req, res) => {
  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    const { branchId, currentUserRole } = req.body;

    // Validate input
    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }

    if (!currentUserRole) {
      return res.status(400).json({ error: 'Current user role is required' });
    }

    // Check if user has permission to view staff
    const allowedRoles = ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'];
    if (!allowedRoles.includes(currentUserRole)) {
      return res.status(403).json({ error: 'Insufficient permissions to view staff' });
    }

    // Query for staff in the branch - we'll get all users and filter by roles array
    const staffQuery = db.collection('users')
      .where('branchId', '==', branchId)
      .where('isActive', '==', true);

    console.log(`Querying users with branchId=${branchId} and isActive=true`);
    
    const staffSnapshot = await staffQuery.get();
    const staff = [];

    console.log(`Found ${staffSnapshot.size} users in branch ${branchId}`);

    staffSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Check if user has the required roles (branchManager or stylist)
      const userRoles = userData.roles || [userData.role];
      const hasRequiredRole = userRoles.includes('branchManager') || 
                             userRoles.includes('stylist') ||
                             userData.role === 'branchManager' ||
                             userData.role === 'stylist';
      
      console.log(`User ${doc.id}: roles=${JSON.stringify(userRoles)}, hasRequiredRole=${hasRequiredRole}`);
      
      if (hasRequiredRole) {
        staff.push({
          id: doc.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          roles: userData.roles || [userData.role],
          branchId: userData.branchId,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          services: userData.services || [], // Staff's assigned services
          ...userData
        });
      }
    });

    console.log(`Returning ${staff.length} staff members`);

    res.status(200).json({
      success: true,
      staff,
      count: staff.length
    });

  } catch (error) {
    console.error('Error getting branch staff:', error);
    res.status(500).json({ error: 'Failed to get branch staff: ' + error.message });
  }
});

/**
 * Get all available services from the services collection
 */
exports.getAllServices = onRequest({ cors: true }, async (req, res) => {
  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    const { currentUserRole } = req.body;

    // Check if user has permission to view services
    const allowedRoles = ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'];
    if (!allowedRoles.includes(currentUserRole)) {
      return res.status(403).json({ error: 'Insufficient permissions to view services' });
    }

    // Get all services
    const servicesSnapshot = await db.collection('services').get();
    const services = [];

    servicesSnapshot.forEach((doc) => {
      const serviceData = doc.data();
      services.push({
        id: doc.id,
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        duration: serviceData.duration,
        category: serviceData.category,
        isActive: serviceData.isActive,
        branches: serviceData.branches || [],
        ...serviceData
      });
    });

    res.status(200).json({
      success: true,
      services,
      count: services.length
    });

  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ error: 'Failed to get services: ' + error.message });
  }
});

/**
 * Update staff member's assigned services
 */
exports.updateStaffServices = onRequest({ cors: true }, async (req, res) => {
  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    const { staffId, services, currentUserRole, currentUserId } = req.body;

    // Validate input
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }

    if (!Array.isArray(services)) {
      return res.status(400).json({ error: 'Services must be an array' });
    }

    // Check if user has permission to update staff services
    const allowedRoles = ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'];
    if (!allowedRoles.includes(currentUserRole)) {
      return res.status(403).json({ error: 'Insufficient permissions to update staff services' });
    }

    // Get the staff member to verify they exist and get their branch
    const staffDoc = await db.collection('users').doc(staffId).get();
    if (!staffDoc.exists) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staffData = staffDoc.data();
    
    // Check if user has the required roles (branchManager or stylist)
    const userRoles = staffData.roles || [staffData.role];
    const hasRequiredRole = userRoles.includes('branchManager') || 
                           userRoles.includes('stylist') ||
                           staffData.role === 'branchManager' ||
                           staffData.role === 'stylist';
    
    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'User is not a staff member (branchManager or stylist)' });
    }

    // For branch managers, they can only update staff in their own branch
    if (currentUserRole === 'branchManager') {
      const currentUserDoc = await db.collection('users').doc(currentUserId).get();
      if (!currentUserDoc.exists) {
        return res.status(404).json({ error: 'Current user not found' });
      }

      const currentUserData = currentUserDoc.data();
      if (currentUserData.branchId !== staffData.branchId) {
        return res.status(403).json({ error: 'You can only update staff in your own branch' });
      }
    }

    // Validate that all services exist
    if (services.length > 0) {
      const serviceIds = services.map(service => typeof service === 'string' ? service : service.id);
      const servicesSnapshot = await db.collection('services')
        .where('__name__', 'in', serviceIds)
        .get();

      if (servicesSnapshot.size !== serviceIds.length) {
        return res.status(400).json({ error: 'One or more services do not exist' });
      }
    }

    // Update the staff member's services
    await db.collection('users').doc(staffId).update({
      services: services,
      updatedAt: new Date(),
      updatedBy: currentUserId
    });

    res.status(200).json({
      success: true,
      message: 'Staff services updated successfully',
      staffId,
      services
    });

  } catch (error) {
    console.error('Error updating staff services:', error);
    res.status(500).json({ error: 'Failed to update staff services: ' + error.message });
  }
});

/**
 * Get staff member details with their assigned services
 */
exports.getStaffDetails = onRequest({ cors: true }, async (req, res) => {
  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    const { staffId, currentUserRole, currentUserId } = req.body;

    // Validate input
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }

    // Check if user has permission to view staff details
    const allowedRoles = ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'];
    if (!allowedRoles.includes(currentUserRole)) {
      return res.status(403).json({ error: 'Insufficient permissions to view staff details' });
    }

    // Get the staff member
    const staffDoc = await db.collection('users').doc(staffId).get();
    if (!staffDoc.exists) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staffData = staffDoc.data();
    
    // Check if user has the required roles (branchManager or stylist)
    const userRoles = staffData.roles || [staffData.role];
    const hasRequiredRole = userRoles.includes('branchManager') || 
                           userRoles.includes('stylist') ||
                           staffData.role === 'branchManager' ||
                           staffData.role === 'stylist';
    
    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'User is not a staff member (branchManager or stylist)' });
    }

    // For branch managers, they can only view staff in their own branch
    if (currentUserRole === 'branchManager') {
      const currentUserDoc = await db.collection('users').doc(currentUserId).get();
      if (!currentUserDoc.exists) {
        return res.status(404).json({ error: 'Current user not found' });
      }

      const currentUserData = currentUserDoc.data();
      if (currentUserData.branchId !== staffData.branchId) {
        return res.status(403).json({ error: 'You can only view staff in your own branch' });
      }
    }

    // Get the staff member's assigned services
    const assignedServices = staffData.services || [];
    let servicesDetails = [];

    if (assignedServices.length > 0) {
      const servicesSnapshot = await db.collection('services')
        .where('__name__', 'in', assignedServices)
        .get();

      servicesSnapshot.forEach((doc) => {
        const serviceData = doc.data();
        servicesDetails.push({
          id: doc.id,
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          category: serviceData.category,
          isActive: serviceData.isActive
        });
      });
    }

    res.status(200).json({
      success: true,
      staff: {
        id: staffId,
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        phone: staffData.phone,
        role: staffData.role,
        branchId: staffData.branchId,
        isActive: staffData.isActive,
        createdAt: staffData.createdAt,
        services: assignedServices,
        servicesDetails
      }
    });

  } catch (error) {
    console.error('Error getting staff details:', error);
    res.status(500).json({ error: 'Failed to get staff details: ' + error.message });
  }
});
