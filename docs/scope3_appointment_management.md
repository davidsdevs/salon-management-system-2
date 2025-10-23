## 🧾 SCOPE 3 — APPOINTMENT MANAGEMENT

**System:** David’s Salon Management System (DSMS)  
**Version:** 1.0  
**Scope Owner:** Project Manager / Technical Lead  
**Reference Docs:**  
- `PROJECT_CONTEXT.md`  
- `SCOPE_1_USER_AND_ROLE_MANAGEMENT.md`  
- `SCOPE_2_BRANCH_MANAGEMENT.md`

---

### 🌟 Objective

Implement a unified **Appointment Management Module** that handles **online and in-branch bookings**, synchronizes with branch operating hours, manages stylist schedules, and ensures accurate appointment lifecycle tracking.

This scope connects clients, receptionists, stylists, and branch administrators through a real-time booking system powered by Firebase.

---

### 🧩 Functional Overview

The Appointment Management module will enable:

- Online & in-salon appointment scheduling.  
- Automatic validation of branch working hours & stylist availability.  
- Real-time updates across clients and staff.  
- Appointment rescheduling, cancellation, and completion tracking.  
- Notification triggers for reminders and status updates via Firebase Cloud Functions.  
- Integration with reports and CRM modules.  

---

### 🤠 Key Users & Permissions

| Role | Permissions |
|------|--------------|
| **Client** | Book, reschedule, cancel appointments, view history. |
| **Receptionist** | Create, modify, and confirm appointments. |
| **Stylist** | View assigned appointments and mark as completed. |
| **Branch Admin / Manager** | Monitor all branch appointments, manage staff schedules. |
| **Operational Manager / System Admin** | Read-only access to all branches for reporting. |

---

### ⚙️ Functional Requirements

#### 1. Appointment Booking
- Clients and receptionists can book appointments.  
- Input fields:  
  - Client name / ID  
  - Service(s)  
  - Stylist  
  - Date & Time  
  - Branch  
  - Notes / Preferences  
- Validate booking against:
  - Branch operating hours  
  - Stylist availability  
  - Overlapping appointments  

#### 2. Appointment Status Flow
Statuses: `Scheduled → Confirmed → In Progress → Completed → Cancelled`  
Each transition updates Firestore in real-time and triggers notifications.

#### 3. Appointment Management Dashboard
- List and filter appointments by date, branch, stylist, or status.  
- Calendar and list views.  
- Quick actions (reschedule, cancel, assign stylist).  

#### 4. Rescheduling & Cancellation
- Clients and receptionists can request reschedules or cancellations.  
- Auto-check conflicts before confirming changes.  
- Maintain audit trail of modifications.

#### 5. Stylist Schedule Integration
- Link stylist availability from working hours table or manual settings.  
- Display stylist schedule calendar.  
- Prevent double-booking per stylist.  

#### 6. Notifications & Reminders
- Automated reminders via Firebase Cloud Functions (SMS/Email).  
- Notification triggers:
  - New booking confirmation  
  - Upcoming appointment reminder (24h & 2h before)  
  - Reschedule/cancellation alerts  

#### 7. Appointment History
- Clients and staff can view completed and cancelled appointments.  
- Store timestamped history for reporting.

---

### 🧱 Data Model (Firestore)

```
/appointments/{appointmentId}
  clientId
  clientName
  branchId
  stylistId
  serviceIds: [serviceId1, serviceId2, ...]
  appointmentDate
  appointmentTime
  status
  notes
  createdBy
  createdAt
  updatedAt
  history: [
    { action: "created", by: "receptionist", timestamp: ... },
    { action: "rescheduled", by: "client", timestamp: ... }
  ]
```

---

### 🔒 Security Rules (Firestore)

```
match /appointments/{appointmentId} {
  allow read, create: if request.auth != null;
  allow update, delete: if (
    request.auth.token.role in ['systemAdmin', 'franchiseOwner', 'branchAdmin', 'receptionist']
    || request.auth.uid == resource.data.clientId
  );
}
```

---

### 🖥️ UI / UX Requirements

| Screen | Description |
|---------|-------------|
| **Appointment List / Dashboard** | Displays all appointments with filters and search. |
| **Appointment Calendar View** | Calendar layout showing stylist bookings. |
| **Booking Form** | Step-by-step form to book new appointments. |
| **Appointment Details Page** | Full view of appointment info, status, and actions. |
| **Client Appointment History** | User view showing past and upcoming appointments. |

- Use consistent DSMS theme via TailwindCSS.  
- Support responsive layout for web and mobile.  
- Use modals for booking/rescheduling forms.  

---

### 🔄 Integration Points

| Module | Integration Purpose |
|---------|----------------------|
| **User & Role Management** | Retrieve client and stylist info for bookings. |
| **Branch Management** | Validate bookings within branch hours and staff availability. |
| **CRM Module** | Feed completed appointments into client service history. |
| **Notifications Module** | Trigger email/SMS alerts. |
| **Reports & Analytics** | Aggregate appointment and utilization data. |

---

### 🧪 Testing & Validation

| Test Area | Description |
|------------|-------------|
| Booking Flow | Verify correct creation and validation of appointments. |
| Rescheduling | Ensure no conflicts and proper updates. |
| Cancellation | Validate authorization and status updates. |
| Notifications | Check triggers and content delivery. |
| Role Permissions | Verify CRUD access for each role type. |
| UI/UX | Validate forms, calendar view, responsiveness, and errors. |

---

### 🧮 Technical Stack
| Layer | Technology |
|-------|-------------|
| Frontend | React.js + TailwindCSS |
| Backend | Firebase (Firestore + Cloud Functions) |
| Database | Firestore (NoSQL) |
| Notifications | Firebase Cloud Messaging (FCM) |
| Email/SMS | SendGrid / Twilio via Cloud Functions |
| Hosting | Firebase Hosting |
| Deployment | Firebase CI/CD |

---

### 📦 Deliverables
- React components for booking, dashboard, and detail views.  
- Firestore schema and rules.  
- Cloud Functions for notification triggers.  
- Role-based access integration.  
- Fully tested booking and scheduling flow.  

---

### ✅ Completion Criteria
- Appointments can be created, rescheduled, and managed across branches.  
- Notifications sent for all major events.  
- Role-based access works as defined.  
- Real-time sync between client, stylist, and receptionist views.  
- Ready for integration with **Scope 4: Billing