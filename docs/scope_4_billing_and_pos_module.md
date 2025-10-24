## 💳 SCOPE 4 — BILLING & POINT OF SALE (POS) MODULE

**System:** David’s Salon Management System (DSMS)  
**Version:** 1.0  
**Scope Owner:** Project Manager / Technical Lead  
**Reference Docs:**  
- `PROJECT_CONTEXT.md`  
- `SCOPE_1_USER_AND_ROLE_MANAGEMENT.md`  
- `SCOPE_2_BRANCH_MANAGEMENT.md`  
- `SCOPE_3_APPOINTMENT_MANAGEMENT.md`

---

### 🌟 Objective

Develop the **Billing and Point of Sale (POS)** module for managing **service charges, discounts, loyalty points, and digital receipts** for salon transactions.  
This will serve as the in-branch billing interface — **no online payment integration** — ensuring smooth, fast, and auditable transactions across all branches.

---

### 🧩 Functional Overview

The Billing & POS module will:

- Process service and product transactions (manual/local POS).  
- Apply discounts, loyalty rewards, and promotional codes.  
- Support walk-in and appointment-based clients.  
- Generate and print/store digital receipts.  
- Log transactions for reporting and analytics.  
- Integrate with inventory for automatic stock deductions.  

---

### 🤠 Key Users & Permissions

| Role | Permissions |
|------|--------------|
| **Receptionist** | Create and complete POS transactions. |
| **Branch Manager** | Review and adjust transactions. |
| **Inventory Controller** | Monitor product usage and deductions. |
| **Franchise Owner / System Admin** | Access all branch billing reports. |

---

### ⚙️ Functional Requirements

#### 1. Transaction Creation
- Start new billing session linked to:
  - Appointment ID (if applicable)
  - Client ID
  - Branch
- **Separate Transactions**: Services and products are processed as separate transactions:
  - **Service Transaction**: Services rendered (from appointment or selected manually)
  - **Product Transaction**: Products sold with inventory deduction
- Add line items with quantity and price
- Auto-fetch stylist commission (if applicable).

#### 2. Discounts & Loyalty Points
- **Service Transactions**: No discounts or loyalty points applied (pure service charges)
- **Product Transactions**: Apply:
  - Fixed amount or percentage discounts.
  - Loyalty/reward point redemption.
- Update client points after transaction completion.

#### 3. Payment Handling
- Record payment method:
  - Cash
  - Credit/Debit (record only, no gateway)
  - Gift voucher
- Mark as “Paid”, “Pending”, or “Cancelled”.

#### 4. Digital Receipts
- Generate PDF receipt with:
  - Salon branding
  - Client info
  - Services/products breakdown
  - Taxes, discounts, and totals
- Save receipt in Firestore under `/receipts/{receiptId}`.
- Option to print or email to client.

#### 5. Integration with Inventory
- **Service Transactions**: No inventory deduction (services don't consume physical products)
- **Product Transactions**: On billing completion:
  - Deduct consumed product quantities.
  - Log deductions in `/inventory_logs`.

#### 6. Refunds / Voiding
- Allow managers to void or refund transactions.
- Maintain audit trail of refunded items.

#### 7. Transaction Separation Logic
- **Service Transactions**:
  - Pure service charges (haircut, styling, etc.)
  - No discounts or loyalty points applied
  - No inventory deduction
  - Linked to appointments and stylists
  - `transactionType: "service"`
  
- **Product Transactions**:
  - Physical product sales (shampoo, conditioner, etc.)
  - Discounts and loyalty points applied
  - Inventory deduction required
  - `transactionType: "product"`

#### 8. Reporting Data
- Store summarized transaction records for daily sales reports.
- Separate reporting for service vs product sales.
- Link to branch analytics and dashboard modules.

---

### 🧱 Data Model (Firestore)

```
/transactions/{transactionId}
  branchId
  appointmentId
  clientId
  stylistIds: [ ... ]
  items: [
    { type: "service", name: "Haircut", price: 300, quantity: 1 },
    { type: "product", name: "Shampoo", price: 150, quantity: 1 }
  ]
  subtotal
  discount
  tax
  total
  paymentMethod
  status
  loyaltyUsed
  loyaltyEarned
  createdBy
  createdAt
  updatedAt
  transactionType: "service" | "product"  // NEW: Separates service and product transactions
  notes: "POS Service Transaction" | "POS Product Transaction"  // NEW: Transaction description
```

---

### 🔒 Security Rules (Firestore)

```
match /transactions/{transactionId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth.token.role in [
    'systemAdmin', 'branchAdmin', 'receptionist', 'manager'
  ];
  allow delete: if request.auth.token.role in ['systemAdmin', 'branchAdmin'];
}
```

---

### 🖥️ UI / UX Requirements

| Screen | Description |
|---------|-------------|
| **POS Dashboard** | Displays ongoing and recent transactions with filters. |
| **Billing Interface** | POS screen to add items, calculate totals, and issue receipts. |
| **Receipt Preview Modal** | View and print generated receipts. |
| **Refund/Adjustment Panel** | Accessible to managers for corrections or refunds. |
| **Transaction History** | Searchable list with filters by date, client, and branch. |

- Use React.js + TailwindCSS for responsive and fast UI.  
- Support dark/light themes for front desk terminals.  
- Use modal or drawer-style interfaces for smooth cashier workflow.  

---

### 🔄 Integration Points

| Module | Integration Purpose |
|---------|----------------------|
| **Appointment Management** | Fetch completed appointments for billing. |
| **CRM Module** | Update client points and purchase history. |
| **Inventory Module** | Deduct stock for products used in billing. |
| **Reports Module** | Feed transaction data for sales and performance analytics. |
| **User & Role Management** | Validate access and logging of transaction creators. |

---

### 🧪 Testing & Validation

| Test Area | Description |
|------------|-------------|
| Transaction Creation | Verify correct item addition, pricing, and totals. |
| Discount Application | Validate correct computation and restrictions. |
| Receipt Generation | Check layout, data accuracy, and Firestore linkage. |
| Inventory Sync | Confirm automatic stock deductions after billing. |
| Access Control | Ensure only allowed roles can edit or void transactions. |
| Performance | Ensure <2s load for POS screen actions. |

---

### 🧮 Technical Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React.js + TailwindCSS |
| Backend | Firebase Cloud Functions |
| Database | Firestore |
| Storage | Firebase Cloud Storage (for receipts) |
| Notifications | Firebase Cloud Messaging |
| PDF Generation | Cloud Function using `pdfkit` or `reportlab` |
| Hosting | Firebase Hosting |
| Deployment | Firebase CI/CD |

---

### 📦 Deliverables
- POS dashboard and billing interface (React components).  
- Firestore schema and security rules.  
- Cloud Functions for receipt generation and stock updates.  
- Role-based permissions and transaction audit logs.  
- Tested and validated end-to-end POS flow.  

---

### ✅ Completion Criteria
- Fully functional POS module with receipt generation.  
- Proper integration with CRM, Inventory, and Appointment modules.  
- Secure and role-restricted billing access.  
- All transactions stored and synced across branches in real-time.  
- Ready for **Scope 5: Inventory Management Module** development.