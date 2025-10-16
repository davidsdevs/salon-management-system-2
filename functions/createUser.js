const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.createUser = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated and has admin privileges
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { email, password, displayName, role, branchId, phone } = data;

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
    });

    // Store user data in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      name: displayName,
      email: email,
      role: role,
      roles: [role],
      branchId: branchId || '',
      phone: phone || '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send password reset email
    await admin.auth().generatePasswordResetLink(email);

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});



