# 💼 SCOPE 6 — CLIENT RELATIONSHIP MANAGEMENT (CRM) MODULE

**System:** David’s Salon Management System (DSMS)  
**Version:** 1.0  
**Scope Owner:** Project Manager / Technical Lead  
**Reference Docs:**  
- `PROJECT_CONTEXT.md`  
- `SCOPE_1_USER_AND_ROLE_MANAGEMENT.md`  
- `SCOPE_2_BRANCH_MANAGEMENT.md`  
- `SCOPE_3_APPOINTMENT_MANAGEMENT.md`  
- `SCOPE_4_BILLING_AND_POS_MODULE.md`  
- `SCOPE_5_INVENTORY_MANAGEMENT.md` (future reference)

---

## 🎯 Objective

Develop a **Client Relationship Management (CRM) Module** to centralize client data, service history, preferences, loyalty points, and feedback.  

The CRM will enhance client engagement, personalize experiences, and support marketing campaigns.

---

## 🧩 Functional Overview

The CRM module will:

- Maintain client master profiles.  
- Record service history (appointments, purchases).  
- Manage loyalty and referral points.  
- Store notes, feedback, and preferences.  
- Allow targeted promotions and communication.  
- Support client lookup and segmentation across branches.  

---

## 🧠 Key Users & Permissions

| **User Role** | **Access Scope** | **Permissions** |
|----------------|------------------|-----------------|
| **System Admin** | Global | Full CRUD access to all client records, backups, and reports. |
| **Franchise Owner / Operational Manager** | Multi-branch | View all branch client data, reports, loyalty summaries. |
| **Branch Admin / Manager** | Branch-level | Manage client data within their branch, update profiles, and review feedback. |
| **Receptionist** | Branch-level | Create and edit client profiles, assign loyalty points, view history. |
| **Stylist** | Branch-level (limited) | View assigned client profiles, notes, and service history. No edit rights. |
| **Inventory Controller** | None | No direct CRM access (read-only access via reports if needed). |
| **Client** | Self | View and update personal info, see loyalty points, and provide feedback. |

---

## ⚙️ Functional Requirements

### 1. Client Profile Management
- Create, edit, deactivate client profiles.  
- Store fields:
  - Name, contact info, gender, birthdate  
  - Branch registration  
  - Preferred stylist, services, products  
  - Loyalty & referral info  
  - Notes (for internal use)

### 2. Service History
- Auto-populate from Appointment & POS modules.  
- Include:
  - Appointment ID, date, services, stylist, total amount.  
- Allow search and filtering by date or service type.  

### 3. Loyalty & Referral Points
- Define loyalty system:
  - Earn points for each completed transaction.  
  - Redeem points via Billing & POS module.  
- Referral points credited when new clients register via referral code.  

### 4. Feedback & Ratings
- Allow clients to submit ratings (1–5 stars) and feedback per service.  
- Branch admins and managers can view reports of feedback trends.  

### 5. Marketing & Promotions
- Admins can segment clients (e.g., VIPs, frequent customers).  
- Trigger promotional notifications via Firebase Cloud Messaging.  
- Optional export to CSV for external marketing tools.  

### 6. Data Sync & Visibility
- Global view for System Admin & Franchise Owner.  
- Branch-restricted view for Branch Admins & Receptionists.  
- Clients can only see their own data.  

---

## 🧱 Data Model (Firestore)

```
/clients/{clientId}
  name
  contactInfo:
    phone
    email
  gender
  birthdate
  branchId
  preferredStylist
  loyaltyPoints
  referralCode
  referredBy
  notes
  createdAt
  updatedAt

/clients/{clientId}/history/{historyId}
  appointmentId
  date
  services: [ ... ]
  stylist
  totalAmount
  rating
  feedback
```

---

## 🔒 Security Rules (Firestore)

```
match /clients/{clientId} {
  allow read, update: if request.auth.uid == clientId;
  allow create, read, update: if request.auth.token.role in [
    'systemAdmin', 'franchiseOwner', 'branchAdmin', 'receptionist'
  ];
}

match /clients/{clientId}/history/{historyId} {
  allow read: if request.auth.uid == clientId
    || request.auth.token.role in ['systemAdmin', 'branchAdmin', 'manager', 'receptionist', 'stylist'];
  allow create, update: if request.auth.token.role in ['systemAdmin', 'branchAdmin', 'receptionist'];
}
```

---

## 🖥️ UI / UX Requirements

| **Screen** | **Description** |
|-------------|-----------------|
| **Client List View** | Shows all clients with filters by name, date joined, loyalty points. |
| **Client Profile Page** | Displays personal info, loyalty, preferences, service history. |
| **Feedback Management** | Admin/staff view of client feedback per appointment. |
| **Client Portal (Mobile)** | Client self-service view — loyalty points, service history, edit profile. |
| **Promotions Dashboard** | Admin UI for sending promos to selected segments. |

- Built using React.js + TailwindCSS.  
- Responsive layout for both desktop (admin) and mobile (client).  
- Use modals for profile editing and feedback forms.  

---

## 🔄 Integration Points

| **Module** | **Integration Purpose** |
|-------------|--------------------------|
| **User & Role Management** | Identify who can access/edit CRM data. |
| **Appointment Management** | Log completed appointments into client history. |
| **Billing & POS** | Update loyalty points and transaction totals. |
| **Notifications** | Send promotional and reminder messages. |
| **Reports & Analytics** | Generate reports on client trends, loyalty usage, and satisfaction. |

---

## 🧪 Testing & Validation

| **Test Area** | **Description** |
|----------------|----------------|
| Profile Management | Validate CRUD operations and role access. |
| History Sync | Ensure automatic logging of appointments and transactions. |
| Loyalty System | Test point accumulation and redemption accuracy. |
| Feedback Submission | Validate ratings and feedback submission flow. |
| Data Permissions | Verify correct visibility by role. |
| Promotions | Confirm notifications send to correct client groups. |

---

## 🧰 Technical Stack

| **Layer** | **Technology** |
|------------|----------------|
| Frontend | React.js + TailwindCSS |
| Backend | Firebase (Cloud Functions + Firestore) |
| Database | Firestore (NoSQL) |
| Notifications | Firebase Cloud Messaging |
| Email | SendGrid via Cloud Functions |
| Hosting | Firebase Hosting |
| Mobile | React Native (client-side access) |

---

## 📦 Deliverables

- CRM dashboard and client profile components.  
- Firestore schema and security rules.  
- Loyalty and referral system integration.  
- Feedback and rating interface.  
- Firebase Cloud Functions for marketing notifications.  

---

## ✅ Completion Criteria

- All user roles access the CRM as defined in permissions.  
- Clients have full self-service visibility.  
- Service history and loyalty data sync correctly.  
- Feedback collected and viewable in dashboards.  
- CRM integrated with Appointments and POS modules.  
- Ready for integration with **Scope 7: Notifications & Communication Module**.
