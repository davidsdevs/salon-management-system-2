# 🧩 SCOPE 1: USER & ROLE MANAGEMENT

## 🎯 Objective
Build a secure, Firebase-powered authentication and authorization system that manages users, their roles, and access levels across multiple branches.

## 🧠 Functional Overview
This module ensures that users (System Admin, Franchise Owner, Branch Admin, Branch Manager, Receptionist, Inventory Controller, Stylist, Client) can log in, access features according to their role, and manage their own profiles. It will also define how branches are linked to users and roles.

## 👥 User Roles & Access Mapping

| **Role** | **Access Scope** | **Key Permissions** |
|----------|------------------|---------------------|
| **System Admin** | Global | Manage all users, roles, and branches |
| **Franchise Owner** | Multi-Branch | Read-only access to reports, dashboards |
| **Branch Admin** | Branch-level | Manage staff, appointments, and inventory for their branch |
| **Branch Manager** | Branch-level | Oversee operations, approve daily reports |
| **Receptionist** | Branch-level | Handle bookings, clients, and billing |
| **Inventory Controller** | Branch-level | Manage inventory for assigned branch |
| **Stylist** | Personal-level | View own appointments, mark services completed |
| **Client** | Limited | Manage own profile, appointments, and feedback |

## ⚙️ TECHNICAL BREAKDOWN

### 1. Firebase Authentication Setup

**Tasks:**
- Configure Firebase Authentication (Email/Password, optional OAuth later)
- Enable user registration and login flows
- Implement secure password reset and verification email flows
- Store user metadata in Firestore (role, branch ID, status, createdAt, etc.)

**Firestore Collection Example:**
```
/users
└── userId
    name: "John Doe"
    email: "john@example.com"
    role: "receptionist"
    branchId: "branch_001"
    isActive: true
    createdAt: <timestamp>
```

### 2. Role-Based Access Control (RBAC)

**Tasks:**
- Create a centralized roles configuration (in Firestore or constants file)
- Apply Firebase Security Rules to restrict access by role
- Use React.js route guards (PrivateRoute, AdminRoute, etc.)
- Implement dynamic UI visibility (e.g., hide "Inventory" tab for stylists)

**Example roles config:**
```javascript
const roles = {
  systemAdmin: ['manageUsers', 'manageBranches', 'viewReports'],
  branchAdmin: ['manageStaff', 'viewReports', 'manageAppointments'],
  receptionist: ['manageAppointments', 'createBilling'],
  stylist: ['viewAppointments'],
  client: ['bookAppointments', 'viewHistory']
};
```

### 3. User CRUD (Admin Panel)

**Tasks:**
- Create "User Management" screen for Admins                                                                                                  
- Add user form (name, email, role, branch)
- Edit user details (role, branch, status)
- Activate/deactivate user
- Display list of users (paginated, searchable, sortable)
- Integrate with Firebase Firestore CRUD APIs

**Firestore Rules Example:**
```javascript
match /users/{userId} {
  allow read, update, delete: if request.auth.token.role == 'systemAdmin';
  allow read: if resource.data.branchId == request.auth.token.branchId;
}
```

### 4. Profile Management (All Users)

**Tasks:**
- Create profile view/edit screen for all users
- Allow avatar upload (Firebase Storage)  
- Allow password update (Firebase Auth)
- Auto-sync updated info to Firestore

### 5. Security & Validation    

**Tasks:**
- Implement Firebase security rules for users, branches, and related collections
- Validate data inputs on both frontend (React) and backend (Cloud Functions)
- Audit logging: record who created/edited/deactivated users

## 🧱 FRONTEND IMPLEMENTATION (React.js + TailwindCSS)

- Login & Register screens
- Forgot password screen
- Admin Dashboard → User Management page
- User Profile page
- Role-based menu & page access

## 📱 MOBILE APP (React Native)

- Client login & signup
- Stylist login (to view appointments)
- Shared auth logic using Firebase Auth SDK

## 🔐 CLOUD FUNCTIONS (Optional)

- `onCreateUser`: assign default role & permissions
- `onDeleteUser`: clean up related data
- `onUpdateUser`: trigger notification to admins if role changes

## ✅ DELIVERABLES

- [ ] Firebase Auth + Firestore integration complete
- [ ] Admin dashboard for managing users
- [ ] Role-based access implemented across web & mobile
- [ ] Secure Firebase Rules tested
- [ ] Profile management module working

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Firebase Setup & Basic Auth
1. Configure Firebase project
2. Set up Authentication (Email/Password)
3. Create basic login/register forms
4. Implement user registration flow

### Phase 2: User Management System
1. Create user management dashboard
2. Implement user CRUD operations
3. Add role assignment functionality
4. Create user profile management

### Phase 3: Role-Based Access Control
1. Implement Firebase Security Rules
2. Create route guards for React
3. Add dynamic UI based on user roles
4. Test access restrictions

### Phase 4: Security & Validation
1. Implement input validation
2. Add audit logging
3. Test security rules
4. Performance optimization

## 📋 TECHNICAL REQUIREMENTS

### Frontend Dependencies
```json
{
  "firebase": "^12.1.0",
  "react-firebase-hooks": "^5.1.1",
  "react-router-dom": "^7.8.2"
}
```

### Firebase Configuration
- Authentication: Email/Password
- Firestore: User data storage
- Storage: Avatar uploads
- Security Rules: Role-based access

### File Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ForgotPassword.jsx
│   ├── admin/
│   │   ├── UserManagement.jsx
│   │   └── UserForm.jsx
│   └── profile/
│       └── ProfilePage.jsx
├── hooks/
│   ├── useAuth.js
│   └── useUser.js
├── services/
│   ├── auth.js
│   └── userService.js
├── utils/
│   ├── roles.js
│   └── permissions.js
└── context/
    └── AuthContext.jsx
```

## 🔒 SECURITY CONSIDERATIONS

1. **Password Requirements**: Minimum 8 characters, mixed case, numbers
2. **Session Management**: Implement secure session handling
3. **Data Validation**: Client and server-side validation
4. **Audit Trail**: Log all user management actions
5. **Role Escalation**: Prevent unauthorized role changes

## 📊 SUCCESS METRICS

- [ ] 100% of users can successfully authenticate
- [ ] Role-based access working correctly
- [ ] Admin can manage all users
- [ ] Profile updates sync across devices
- [ ] Security rules prevent unauthorized access

## 🎯 NEXT STEPS

After completing Scope 1, proceed to:
- **Scope 2**: Branch Management
- **Scope 3**: Appointment Scheduling
- **Scope 4**: Billing & POS
- **Scope 5**: Inventory Control

---

**Estimated Timeline**: 3-4 weeks  
**Priority**: High  
**Dependencies**: Firebase project setup
