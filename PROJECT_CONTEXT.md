# 🧾 PROJECT CONTEXT — David’s Salon Management System (DSMS)

**Source:** Official Project Charter & Software Requirement Specification (SRS)  
**Version:** 1.1  
**Prepared by:** [Project Manager’s Name]  
**Date:** [Insert Date]  

---

## 1. PROJECT OVERVIEW

David’s Salon operates multiple branches, each managing appointments, inventory, and staff independently.  
This decentralized structure creates inefficiencies, inconsistent reporting, and limited managerial visibility.

The **David’s Salon Management System (DSMS)** will centralize operations across all branches through a **cloud-based platform powered by Firebase**.  
It will streamline workflows, improve customer experience, and provide actionable insights for management, ensuring consistency, efficiency, and scalability.

---

## 2. PROJECT OBJECTIVES

- Centralize multi-branch salon operations using a cloud-based system.  
- Simplify appointment management and staff scheduling.  
- Enable real-time visibility of branch performance.  
- Enhance client engagement through digital bookings and profiles.  
- Improve inventory tracking and minimize wastage.  
- Ensure secure, role-based data access with cloud scalability.

---

## 3. PROJECT SCOPE

### 3.1 In-Scope
The DSMS includes:

- User & Role Management  
- Multi-Branch Management  
- Appointment Scheduling  
- Billing (non-integrated, local POS)  
- Inventory Control  
- Client Relationship Management (CRM)  
- Notifications (Email/SMS)  
- Reports & Analytics  
- Cloud-based Security and Backup  

### 3.2 Out-of-Scope
- Online Payment Gateway Integration  
- Hardware procurement (POS terminals, scanners)  
- External HR/Payroll integrations (initial phase)  

---

## 4. KEY STAKEHOLDERS

| **Role** | **Responsibility** |
|-----------|--------------------|
| Project Sponsor | Funding, overall oversight, approvals |
| Project Manager | Planning, coordination, execution, stakeholder reporting |
| System Admin | Global configurations, access management |
| Franchise Owner / Operational Manager | Reviews performance across all branches |
| Branch Admin / Manager | Oversees staff, appointments, and branch KPIs |
| Receptionist | Manages bookings, billing, and check-ins |
| Inventory Controller | Tracks stock, orders, and supplier relations |
| Stylist | Manages schedule and service completion |
| Client | Books services, maintains profile, provides feedback |

---

## 5. SYSTEM USERS & PERMISSIONS

| **User Type** | **Access Level** | **Key Responsibilities** |
|----------------|------------------|---------------------------|
| System Admin | Global | Manage branches, roles, users, configurations |
| Franchise Owner | Multi-branch | Monitor performance, reports, and compliance |
| Branch Admin | Branch-level | Manage operations, staff, and local reports |
| Branch Manager | Branch-level | Handle daily operations, schedules, and clients |
| Receptionist | Front-desk | Schedule appointments, check-ins, issue bills |
| Inventory Controller | Branch-level | Manage stock, supplier orders, and audits |
| Stylist | Individual | View schedules, update service statuses |
| Client | Limited | Book services, update profile, receive notifications |

---

## 6. FUNCTIONAL REQUIREMENTS

### 6.1 User & Role Management
- Role-based authentication and access control via Firebase Authentication  
- User creation, editing, and deactivation  
- Password reset and account verification via email  

### 6.2 Branch Management
- Create and manage multiple branches  
- Assign staff and services per branch  
- Configure working hours and holidays  

### 6.3 Appointment Management
- Online and in-branch bookings  
- Appointment rescheduling and cancellations  
- Staff and service availability tracking  
- SMS/Email reminders via Firebase Cloud Functions  

### 6.4 Billing & Point of Sale
- Local POS-based billing (manual entry)  
- Apply discounts and loyalty rewards  
- Generate and store digital receipts (no online payment processing)  

### 6.5 Inventory Management
- Add/update stock items with quantities  
- Track consumption and wastage  
- Generate low-stock alerts via Firebase Cloud Messaging  
- Supplier and purchase order records  

### 6.6 CRM Module
- Maintain detailed client profiles  
- Track service history and preferences  
- Manage loyalty and referral points  
- Enable client feedback and ratings  

### 6.7 Reports & Analytics
- Real-time branch sales dashboards  
- Staff performance reports  
- Appointment and service utilization trends  
- Inventory consumption analytics  

### 6.8 Notifications & Communication
- Appointment reminders and updates (SMS/Email)  
- Promotions and client engagement campaigns  
- Low-stock and system alerts for staff  

### 6.9 Security & Audit
- Firebase Authentication and Firestore Rules for access control  
- Encrypted data storage and transfer  
- Activity logging for key user actions  
- Regular automated backups  

---

## 7. NON-FUNCTIONAL REQUIREMENTS

| **Category** | **Requirement** |
|---------------|----------------|
| **Performance** | <2-second response time under standard load |
| **Scalability** | Must support 50+ branches and 10,000+ concurrent users |
| **Availability** | Minimum uptime of 99.5% using Firebase SLA |
| **Usability** | Intuitive interface; mobile-responsive UI |
| **Security** | End-to-end encryption; Firebase Security Rules applied |
| **Backup & Recovery** | Automated daily backups on Firebase Cloud Storage |
| **Maintainability** | Modular structure via Firebase Cloud Functions |

---

## 8. TECHNOLOGY STACK (FINALIZED)

| **Layer** | **Technology** |
|------------|----------------|
| Frontend (Web) | React.js + TailwindCSS |
| Backend | Firebase (Auth, Firestore, Cloud Functions) |
| Database | Firebase Firestore (NoSQL) |
| Mobile App | React Native (Android/iOS) |
| Hosting | Firebase Hosting / Google Cloud |
| Notifications | Firebase Cloud Messaging (FCM) |
| Email/SMS Integration | SendGrid / Twilio via Cloud Functions |
| Version Control | GitHub / GitLab |
| Deployment | Firebase CI/CD Pipeline |

---

## 9. PROJECT TIMELINE (ESTIMATED)

| **Phase** | **Duration** | **Deliverables** |
|------------|--------------|------------------|
| Requirement Gathering & Analysis | 2 weeks | SRS, Workflow Diagrams |
| System Design (UI/UX + Architecture) | 2 weeks | Wireframes, Data Models, ERD |
| Backend Setup (Firebase) | 3 weeks | Firestore Schema, Cloud Functions, Auth Setup |
| Frontend Development (React.js) | 4 weeks | Admin Dashboards, Branch Interfaces |
| Mobile App Development (React Native) | 4 weeks | Client and Stylist App |
| Integration & Testing | 3 weeks | System + UAT Testing |
| Deployment & Training | 2 weeks | Production Release, Documentation |
| Maintenance & Support | Ongoing | Bug Fixes, Feature Enhancements |

**Total Duration:** ~18 Weeks (4.5 Months)

---

## 10. RISK MANAGEMENT PLAN

| **Risk** | **Impact** | **Mitigation Strategy** |
|-----------|-------------|--------------------------|
| Firebase quota limits or cost spikes | Medium | Monitor usage, optimize reads/writes |
| Internet dependency for branches | High | Enable local caching for critical data |
| Change in operational workflow | Medium | Conduct pilot rollout and staff training |
| Data inconsistency | High | Apply Firestore validation & transaction logic |
| User resistance to new system | Medium | Provide onboarding and continuous support |

---

## 11. SUCCESS CRITERIA

- Deployment across all branches within 4.5 months  
- Real-time visibility of branch operations  
- 25–30% increase in scheduling efficiency  
- 20% reduction in inventory losses  
- ≥90% positive feedback from staff and clients  

---

## 12. FUTURE ENHANCEMENTS

- AI-driven stylist recommendations and dynamic pricing  
- Predictive inventory restocking using analytics  
- Integration with accounting systems (QuickBooks/Xero)  
- Employee performance and reward system  
- Self-check-in kiosks (hardware optional)  

---

## 13. APPROVALS

| **Role** | **Name** | **Signature** | **Date** |
|-----------|-----------|----------------|-----------|
| Project Sponsor | | | |
| Franchise Owner | | | |
| Project Manager | | | |
| Technical Lead | | | |

---

## 💡 DEVELOPMENT CONTEXT FOR AI TOOLS (e.g., Cursor, GitHub Copilot)

**Primary Tech Focus:**
- Backend: Firebase (Auth, Firestore, Functions)
- Frontend: React.js + TailwindCSS
- Mobile: React Native
- Database: Firestore (NoSQL)
- No payment gateway integration

**Current Phase:**  
Scope 1 — User & Role Management  
(Next: Branch Management → Appointment → Billing → Inventory → CRM → Reports)

**AI Prompting Guidelines:**  
When generating or refactoring code:
- Follow the structure and modules outlined above.  
- Use Firebase Firestore for all persistent data.  
- Enforce role-based access through Firebase Rules.  
- Maintain modular, reusable React components.  
- Match variable and collection names to this context.

**Cursor Context Setup:**  
In `.cursor/context`, include:
