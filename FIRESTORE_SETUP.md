# Firestore Security Rules Setup

## Problem
You're getting "Missing or insufficient permissions" error when trying to save user data to Firestore.

## Solution
Update your Firestore security rules to allow authenticated users to write to the `users` collection.

## Step-by-Step Setup

### 1. Go to Firebase Console
- Visit [console.firebase.google.com](https://console.firebase.google.com)
- Select your project: `davidsalon-d18ca`

### 2. Navigate to Firestore
- Click on "Firestore Database" in the left sidebar
- Click on the "Rules" tab

### 3. Update Security Rules
Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write, create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read basic user info (for admin purposes)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    
    // Add other collections as needed
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
    
    match /services/{serviceId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Publish Rules
- Click "Publish" to save the new rules
- Wait a few minutes for rules to take effect

## What These Rules Do

- **Users Collection**: Authenticated users can create/read/write their own user document
- **Appointments**: Authenticated users can manage appointments
- **Services**: Public read access, authenticated write access
- **Security**: Default deny all other collections

## Testing

After updating rules:
1. Try the registration process again
2. Check browser console for success messages
3. Verify user data appears in Firestore

## Alternative (Temporary)

If you want to test without updating rules, the current code will:
- Create the Firebase Auth account
- Send verification email
- Skip Firestore save (with warning)
- Complete registration

## Need Help?

- Check Firebase Console for rule syntax errors
- Ensure rules are published
- Wait 2-3 minutes for rules to propagate
- Check browser console for detailed error messages
