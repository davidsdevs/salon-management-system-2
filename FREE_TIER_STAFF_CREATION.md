# Free Tier Staff Creation Flow

## Overview
This system allows branch managers to create staff accounts without requiring Firebase Cloud Functions (Blaze plan). Staff complete their registration themselves using a temporary password.

## ⚠️ Important: Firebase Authentication
**Staff are NOT created in Firebase Authentication immediately.**
- Manager creates a Firestore record only (no Auth account)
- Staff must complete registration to create their Firebase Auth account
- This is intentional for free tier compatibility (no Cloud Functions needed)

## How It Works

### 1. Branch Manager Creates Staff (Frontend Only)
- Manager fills out staff details in the Staff Management page
- System generates a strong temporary password
- Creates a Firestore document with:
  - `isPendingActivation: true`
  - `isActive: false`
  - `tempPassword: [generated password]`
  - All staff details (name, email, role, branchId, etc.)
- Manager receives email and temporary password to share with staff

### 2. Staff Completes Registration
- Staff goes to `/register` page
- Enters their email and the temporary password (in both password fields)
- System:
  - Finds pre-registered user by email
  - Verifies tempPassword matches
  - Creates Firebase Auth user
  - Updates Firestore document:
    - Sets `isActive: true`
    - Sets `isPendingActivation: false`
    - Removes `tempPassword` field
    - Adds Firebase Auth `uid`
  - Sends email verification

### 3. Staff Can Log In
- After email verification, staff can log in with their email and temporary password
- They should change their password after first login

## Key Files Modified

### Frontend
- `src/pages/04_BranchManager/Staff.jsx` - Staff creation UI with password display, fixed view details to use Firestore doc ID
- `src/pages/04_BranchManager/StaffDetails.jsx` - Shows pending activation warning banner, handles users without Firebase Auth UID
- `src/services/userService.js` - Added `createPreRegisteredUser()` method
- `src/services/authService.js` - Updated `register()` to handle pre-registered users with temp password verification
- `src/pages/00_Auth/RegisterForm.jsx` - (Uses existing authService)

### Important Implementation Details
- **Viewing Staff Details**: Uses Firestore document ID (`s.id`) instead of Firebase Auth UID (`s.uid`) to support pending users
- **Updating Staff**: Uses `staff.uid || staff.id` fallback to support both active and pending users
- **Staff List Filter**: Includes both `isActive` and `isPendingActivation` users

### Firestore Structure
```javascript
// Pre-registered user (before activation)
{
  email: "staff@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "stylist",
  roles: ["stylist"],
  branchId: "branch123",
  isPendingActivation: true,
  isActive: false,
  tempPassword: "abc123DEF!4",
  createdAt: Timestamp,
  createdBy: "managerUid"
}

// Activated user (after registration)
{
  uid: "firebaseAuthUid",
  email: "staff@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "stylist",
  roles: ["stylist"],
  branchId: "branch123",
  isPendingActivation: false,
  isActive: true,
  // tempPassword removed
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Security Notes
- Temporary passwords are stored in plain text briefly (until activation)
- Staff must use exact temp password to activate
- Passwords should be changed after first login
- Email verification is required before full access
- Firestore security rules enforce branch-based access

## Advantages vs Cloud Functions
- ✅ Works on Firebase Spark (free) plan
- ✅ No billing required
- ✅ Simple, transparent flow
- ✅ Manager stays logged in (no session interruption)

## Trade-offs
- ⚠️ Temp password stored briefly in Firestore
- ⚠️ Staff must complete registration themselves
- ⚠️ Two-step process (create + activate)

## Migration Path
If you upgrade to Blaze plan later, you can:
- Deploy Cloud Functions
- Switch to `createUserViaFunction()` in Staff.jsx
- Create Firebase Auth users directly without temp passwords
- Single-step process with immediate account creation
