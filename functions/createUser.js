const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.createUser = functions.region('us-central1').https.onCall(async (data, context) => {
  console.log('=== createUser called ===');
  console.log('Context auth:', context.auth ? `UID: ${context.auth.uid}` : 'Not authenticated');
  console.log('Data received:', JSON.stringify({ email: data.email, role: data.role, branchId: data.branchId, hasPassword: !!data.password }));
  
  // Verify the caller is authenticated and has admin privileges
  if (!context.auth) {
    console.error('AUTHENTICATION FAILED: No context.auth');
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { email, password, displayName, role, branchId, phone, firstName, middleName, lastName, address, certificates } = data;

  try {
    // Basic validation
    console.log('Step 1: Validating inputs...');
    if (!email || !password) {
      console.error('VALIDATION FAILED: Missing email or password');
      throw new functions.https.HttpsError('invalid-argument', 'Email and password are required');
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      console.error('VALIDATION FAILED: Invalid types', { emailType: typeof email, passwordType: typeof password });
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email or password format');
    }
    console.log('Step 1: Validation passed');

    // Create user in Firebase Auth
    console.log('Step 2: Creating user in Firebase Auth...', { email, displayName });
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
    });
    console.log('Step 2: User created in Auth with UID:', userRecord.uid);

    // Store user data in Firestore
    const userDoc = {
      uid: userRecord.uid,
      name: displayName,
      email: email,
      role: role,
      roles: [role],
      branchId: branchId || '',
      phone: phone || '',
      firstName: firstName || '',
      middleName: middleName || '',
      lastName: lastName || '',
      address: address || '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // If certificates provided, store as map on user doc
    if (certificates && Array.isArray(certificates)) {
      const certMap = {};
      certificates.forEach((c) => {
        const id = c.id || admin.firestore().collection('_tmp').doc().id;
        certMap[id] = {
          name: c.name || '',
          issuer: c.issuer || '',
          date: c.date || '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
      });
      userDoc.certificates = certMap;
    }

    console.log('Step 3: Writing user document to Firestore...', { uid: userRecord.uid });
    await admin.firestore().collection('users').doc(userRecord.uid).set(userDoc);
    console.log('Step 3: User document written successfully');

    // Generate password reset link (optional: you can send this via your own email service)
    console.log('Step 4: Generating password reset link...');
    let resetLink = null;
    try {
      resetLink = await admin.auth().generatePasswordResetLink(email);
      console.log('Step 4: Password reset link generated');
    } catch (err) {
      console.warn('Step 4: Failed to generate password reset link:', err?.message || err);
    }

    console.log('=== createUser SUCCESS ===');
    return { success: true, uid: userRecord.uid, resetLink };
  } catch (error) {
    console.error('=== createUser ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('Stack trace:', error?.stack);
    
    // Map common Admin errors to callable error codes for better client messages
    const code = error?.code || '';
    if (code === 'auth/email-already-exists') {
      console.error('Mapped to: already-exists');
      throw new functions.https.HttpsError('already-exists', `Email already exists: ${email}`);
    }
    if (code === 'auth/invalid-email') {
      console.error('Mapped to: invalid-argument (invalid-email)');
      throw new functions.https.HttpsError('invalid-argument', `Invalid email format: ${email}`);
    }
    if (code === 'auth/invalid-password') {
      console.error('Mapped to: invalid-argument (invalid-password)');
      throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
    }
    if (code === 'auth/operation-not-allowed') {
      console.error('Mapped to: failed-precondition (operation-not-allowed)');
      throw new functions.https.HttpsError('failed-precondition', 'Email/password authentication is not enabled');
    }
    // Fallback with more detail
    console.error('Mapped to: internal (fallback)');
    const detailedMessage = `Internal error: ${error?.message || 'Unknown error'}${error?.code ? ` (code: ${error.code})` : ''}`;
    throw new functions.https.HttpsError('internal', detailedMessage);
  }
});



