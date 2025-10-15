## 🧾 SCOPE 2 — BRANCH MANAGEMENT

**System:** David’s Salon Management System (DSMS)  
**Version:** 1.0  
**Scope Owner:** Project Manager / Technical Lead  
**Reference Docs:**  
- `PROJECT_CONTEXT.md`  
- `SCOPE_1_USER_AND_ROLE_MANAGEMENT.md`  

---

### 🎯 Objective

To implement a **centralized Branch Management module** that allows the **System Admin** and **Franchise Owner** to create, configure, and manage salon branches.  
This module connects directly with the User & Role Management system by linking staff and operational users to their respective branches.

---

### 🧩 Functional Overview

The Branch Management module will enable:
- Creation and management of multiple branches.  
- Assignment of staff (Branch Admin, Managers, Receptionists, Stylists, etc.) to each branch.  
- Configuration of working hours, holidays, and available services.  
- Real-time synchronization of branch data across all connected users.  
- Firestore-based storage with branch-specific security rules.  

---

### 🧠 Key Users & Permissions

| Role | Permissions in this Module |
|------|-----------------------------|
| **System Admin** | Full access — create, edit, deactivate any branch. |
| **Franchise Owner** | View and manage branches under ownership. |
| **Branch Admin** | Manage assigned branch’s configuration, working hours, and staff. |
| **Branch Manager** | Limited management: edit schedules and staff assignments. |
| **Other Roles** | Read-only branch info (for context, reporting, or service linking). |

---

### ⚙️ Functional Requirements

#### 1. Branch Creation & Configuration
- Add new branch with details:  
  - Branch Name  
  - Address  
  - Contact Info  
  - Operating Hours (per day)  
  - Services Offered (linked to master service list)  
  - Assigned Branch Admin / Manager  
- Edit or deactivate a branch.  
- Auto-generate `branchId` for each new branch.

#### 2. Staff Assignment
- Assign existing users to a branch.  
- Display available staff filtered by role.  
- Prevent duplicate assignments across branches unless allowed by system admin.  
- Reflect staff-to-branch relationships in `/users/{userId}.branchId`.

#### 3. Branch Dashboard
- Show branch summary:  
  - Total staff count  
  - Current appointments  
  - Inventory overview (summary from next scope)  
  - Recent activity logs  
- Accessible by System Admin, Franchise Owner, and Branch Admin.

#### 4. Operating Hours & Holidays
- Set default working days and hours per branch.  
- Configure special dates (holidays or maintenance days).  
- Sync with appointment scheduling module.

#### 5. Service Configuration
- Link available services to each branch.  
- Define pricing, duration, and stylist eligibility (if applicable).  
- Allow cloning of service setups from another branch for faster configuration.

#### 6. Data Model (Firestore)
```
/branches/{branchId}
  name
  address
  contactNumber
  operatingHours: {
    monday: { open: "09:00", close: "18:00" },
    tuesday: {...},
    ...
  }
  holidays: [ "2025-12-25", "2025-12-31" ]
  services: [serviceId1, serviceId2, ...]
  branchAdminId
  managerId
  isActive
  createdAt
  updatedAt
```

---

### 🔒 Security Rules (Firestore)

```
match /branches/{branchId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth.token.role in ['systemAdmin', 'franchiseOwner'];
  allow update: if request.auth.token.role == 'branchAdmin' && request.auth.token.branchId == branchId;
}
```

---

### 🖥️ UI / UX Requirements

| Screen | Description |
|---------|-------------|
| **Branch List Page** | Displays all branches with status, staff count, and location. |
| **Branch Form (Add/Edit)** | Form to create or update branch details and configuration. |
| **Branch Details Page** | Overview of branch info, assigned staff, and operational summary. |
| **Branch Settings Page** | Manage operating hours, holidays, and linked services. |

- Use a consistent React.js component pattern as Scope 1.  
- Use TailwindCSS for layout and styling.  
- Include modals for add/edit actions and confirmation dialogs for deletions.

---

### 🔄 Integration Points

| Module | Description |
|---------|-------------|
| **User & Role Management** | Staff assignment references user data from `/users`. |
| **Appointment Management** | Branch hours and holidays sync for scheduling availability. |
| **Inventory Management** | Inventory records will be linked by `branchId`. |
| **Reports & Analytics** | Branch-specific dashboards for admins and owners. |

---

### 🧪 Testing & Validation

| Test Area | Description |
|------------|-------------|
| CRUD Operations | Validate add, edit, deactivate branch. |
| Security Rules | Test all allowed and denied actions based on user role. |
| Data Sync | Ensure branch updates reflect in related modules. |
| Staff Linking | Confirm correct staff association and branch data integrity. |
| UI/UX | Check responsiveness, field validations, and error handling. |

---

### 🧮 Technical Stack
| Layer | Technology |
|-------|-------------|
| Frontend | React.js + TailwindCSS |
| Backend | Firebase (Firestore + Cloud Functions) |
| Database | Firestore (NoSQL) |
| Hosting | Firebase Hosting |
| Version Control | GitHub / GitLab |
| Deployment | Firebase CI/CD |

---

### 🗗️ Deliverables

- React.js components for Branch CRUD and detail views.  
- Firestore branch schema and integration.  
- Cloud Functions for branch-level operations (optional automation).  
- Role-based access control integration.  
- Testing scripts and deployment-ready build.

---

### ✅ Completion Criteria

- System Admin and Franchise Owner can create, edit, and manage branches.  
- Branch Admin can update branch-specific settings.  
- All branch data securely stored in Firestore.  
- UI fully functional and aligned with DSMS theme.  
- Ready for integration with **Scope 3: Appointment Management**.

