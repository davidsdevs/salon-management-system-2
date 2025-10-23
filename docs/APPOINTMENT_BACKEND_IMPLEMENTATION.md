# Appointment Backend Implementation

This document describes the complete backend implementation for the salon management system's appointment functionality, supporting the exact data structure you provided.

## Overview

The backend implementation consists of:

1. **Firebase Cloud Functions** - Server-side processing and validation
2. **Client-side Services** - API integration and data management
3. **Data Models** - Structured data handling
4. **Validation Services** - Data validation and sanitization
5. **Example Usage** - Complete implementation examples

## Data Structure Support

The backend fully supports your appointment data structure:

```javascript
{
  appointmentDate: "2025-10-17",
  appointmentTime: "18:00", 
  branchId: "KYiL9JprSX3LBOYzrF6e",
  clientId: "",
  clientInfo: {
    id: "5",
    isNewClient: false,
    name: "Sarah Lee",
    clientName: "Sarah Lee"
  },
  createdAt: "October 17, 2025 at 1:53:17 PM UTC+8",
  createdBy: "S3h78a8XP6YkUgjOmaO1h1mq5kq2",
  history: [
    {
      action: "created",
      by: "S3h78a8XP6YkUgjOmaO1h1mq5kq2",
      notes: "Appointment created",
      timestamp: "2025-10-17T05:53:17.542Z"
    },
    {
      action: "status_changed_to_confirmed",
      by: "3xwdBFLGmEQOIfWyqKLaOK3mRG93",
      notes: "Appointment updated",
      timestamp: "2025-10-18T12:47:29.208Z"
    }
  ],
  isNewClient: false,
  newClientName: "",
  notes: "chemical",
  serviceIds: ["1", "2"],
  status: "confirmed",
  stylistId: "1",
  updatedAt: "October 18, 2025 at 8:47:28 PM UTC+8"
}
```

## Firebase Cloud Functions

### Functions Available

1. **createAppointment** - Create new appointments
2. **updateAppointment** - Update existing appointments
3. **getAppointments** - Retrieve appointments with filtering
4. **getAppointmentById** - Get specific appointment
5. **cancelAppointment** - Cancel appointments
6. **completeAppointment** - Mark appointments as completed

### Deployment

```bash
# Install dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions
```

## Client-Side Services

### AppointmentApiService

Main service for interacting with the backend:

```javascript
import { appointmentApiService } from './services/appointmentApiService';

// Create appointment
const appointment = await appointmentApiService.createAppointmentFromStructure(yourData);

// Update appointment
const updated = await appointmentApiService.updateAppointment(id, updateData);

// Get appointments
const appointments = await appointmentApiService.getAppointments(filters);

// Cancel appointment
const cancelled = await appointmentApiService.cancelAppointment(id, reason);
```

### AppointmentModel

Data model for structured appointment handling:

```javascript
import { AppointmentModel } from './models/AppointmentModel';

// Create from your data structure
const appointment = AppointmentModel.fromDataStructure(yourData);

// Use model methods
console.log(appointment.getClientDisplayName());
console.log(appointment.getFormattedDate());
console.log(appointment.getFormattedTime());

// Add history entry
appointment.addHistoryEntry('status_changed_to_completed', 'user123', 'Completed');

// Update status
appointment.updateStatus('completed', 'user123', 'All services done');
```

### Validation Service

Comprehensive data validation:

```javascript
import { AppointmentValidationService } from './services/appointmentValidationService';

// Validate appointment data
const validation = AppointmentValidationService.validateAppointmentData(appointmentData);

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Sanitize data
const sanitized = AppointmentValidationService.sanitizeAppointmentData(appointmentData);
```

## API Endpoints

### Create Appointment

```javascript
// Using your exact data structure
const appointmentData = {
  appointmentDate: "2025-10-17",
  appointmentTime: "18:00",
  branchId: "KYiL9JprSX3LBOYzrF6e",
  clientId: "",
  clientInfo: {
    id: "5",
    isNewClient: false,
    name: "Sarah Lee",
    clientName: "Sarah Lee"
  },
  serviceIds: ["1", "2"],
  stylistId: "1",
  notes: "chemical"
};

const appointment = await appointmentApiService.createAppointmentFromStructure(appointmentData);
```

### Update Appointment

```javascript
// Update status
const confirmed = await appointmentApiService.confirmAppointment(appointmentId, 'Confirmed by receptionist');

// Start appointment
const started = await appointmentApiService.startAppointment(appointmentId, 'Started by stylist');

// Complete appointment
const completed = await appointmentApiService.completeAppointment(appointmentId, 'All services completed');
```

### Get Appointments

```javascript
// Get all appointments
const all = await appointmentApiService.getAppointments();

// Get by status
const confirmed = await appointmentApiService.getAppointmentsByStatus('confirmed');

// Get by date range
const october = await appointmentApiService.getAppointmentsByDateRange('2025-10-01', '2025-10-31');

// Get by client
const clientAppointments = await appointmentApiService.getAppointmentsByClientId('client123');

// Get by stylist
const stylistAppointments = await appointmentApiService.getAppointmentsByStylistId('stylist1');
```

### Search Appointments

```javascript
// Search by client name
const results = await appointmentApiService.searchAppointments('Sarah');

// Search with filters
const filtered = await appointmentApiService.searchAppointments('chemical', {
  status: 'confirmed',
  branchId: 'KYiL9JprSX3LBOYzrF6e'
});
```

## Status Management

### Status Flow

```
scheduled → confirmed → in_progress → completed
    ↓           ↓           ↓
cancelled ← cancelled ← cancelled
```

### Status Transitions

- **scheduled** → confirmed, cancelled
- **confirmed** → in_progress, cancelled  
- **in_progress** → completed, cancelled
- **completed** → (terminal state)
- **cancelled** → (terminal state)

## History Tracking

Every appointment maintains a complete history of changes:

```javascript
{
  action: "status_changed_to_confirmed",
  by: "user123",
  timestamp: "2025-10-18T12:47:29.208Z",
  notes: "Appointment confirmed by receptionist"
}
```

### History Actions

- `created` - Appointment created
- `status_changed_to_*` - Status changes
- `client_info_updated` - Client information updated
- `rescheduled` - Appointment rescheduled
- `cancelled` - Appointment cancelled

## Data Validation

### Required Fields

- `appointmentDate` - Date in YYYY-MM-DD format
- `appointmentTime` - Time in HH:MM format
- `branchId` - Branch identifier
- `stylistId` - Stylist identifier
- `serviceIds` - Array of service identifiers

### Client Information

For new clients:
- `isNewClient: true`
- `newClientName` or `clientName` required

For existing clients:
- `isNewClient: false`
- `clientId` required

### Validation Rules

- Appointment must be in the future
- Time must be in valid HH:MM format
- Date must be in valid YYYY-MM-DD format
- Client name max 100 characters
- Notes max 500 characters
- History notes max 200 characters

## Error Handling

### Common Errors

1. **Validation Errors**
   ```javascript
   try {
     const appointment = await appointmentApiService.createAppointment(data);
   } catch (error) {
     if (error.message.includes('Validation failed')) {
       console.error('Data validation failed:', error.message);
     }
   }
   ```

2. **Permission Errors**
   ```javascript
   try {
     const appointment = await appointmentApiService.updateAppointment(id, data);
   } catch (error) {
     if (error.message.includes('Insufficient permissions')) {
       console.error('User lacks permission to update appointment');
     }
   }
   ```

3. **Conflict Errors**
   ```javascript
   try {
     const appointment = await appointmentApiService.createAppointment(data);
   } catch (error) {
     if (error.message.includes('already booked')) {
       console.error('Stylist is already booked at this time');
     }
   }
   ```

## Usage Examples

### Complete Workflow

```javascript
import { appointmentApiService } from './services/appointmentApiService';

async function completeAppointmentWorkflow() {
  try {
    // 1. Create appointment
    const appointment = await appointmentApiService.createAppointmentFromStructure({
      appointmentDate: "2025-10-17",
      appointmentTime: "18:00",
      branchId: "KYiL9JprSX3LBOYzrF6e",
      clientInfo: { name: "Sarah Lee" },
      serviceIds: ["1", "2"],
      stylistId: "1",
      notes: "chemical"
    });

    // 2. Confirm appointment
    await appointmentApiService.confirmAppointment(appointment.id, 'Confirmed');

    // 3. Start appointment
    await appointmentApiService.startAppointment(appointment.id, 'Started');

    // 4. Complete appointment
    await appointmentApiService.completeAppointment(appointment.id, 'Completed');

    console.log('Appointment workflow completed successfully');
  } catch (error) {
    console.error('Workflow failed:', error);
  }
}
```

### Working with Data Models

```javascript
import { AppointmentModel } from './models/AppointmentModel';

// Create model from your data
const appointment = AppointmentModel.fromDataStructure(yourData);

// Use model methods
console.log('Client:', appointment.getClientDisplayName());
console.log('Date:', appointment.getFormattedDate());
console.log('Time:', appointment.getFormattedTime());
console.log('Is today:', appointment.isToday());
console.log('Is past:', appointment.isPastAppointment());

// Add history
appointment.addHistoryEntry('custom_action', 'user123', 'Custom note');

// Update status
appointment.updateStatus('completed', 'user123', 'All done');

// Validate
const validation = appointment.validate();
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

## Testing

### Unit Tests

```javascript
import { AppointmentValidationService } from './services/appointmentValidationService';

// Test validation
const testData = {
  appointmentDate: "2025-10-17",
  appointmentTime: "18:00",
  branchId: "branch123",
  stylistId: "stylist1",
  serviceIds: ["1", "2"]
};

const validation = AppointmentValidationService.validateAppointmentData(testData);
console.assert(validation.isValid, 'Test data should be valid');
```

### Integration Tests

```javascript
import { appointmentApiService } from './services/appointmentApiService';

async function testAppointmentCRUD() {
  // Create
  const created = await appointmentApiService.createAppointmentFromStructure(testData);
  console.assert(created.id, 'Appointment should have ID');

  // Read
  const retrieved = await appointmentApiService.getAppointmentById(created.id);
  console.assert(retrieved.id === created.id, 'Should retrieve same appointment');

  // Update
  const updated = await appointmentApiService.updateAppointment(created.id, { status: 'confirmed' });
  console.assert(updated.status === 'confirmed', 'Status should be updated');

  // Delete (cancel)
  const cancelled = await appointmentApiService.cancelAppointment(created.id, 'Test cancellation');
  console.assert(cancelled.status === 'cancelled', 'Should be cancelled');
}
```

## Deployment

### Firebase Functions

```bash
# Install dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions
```

### Environment Variables

Ensure these environment variables are set:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Security

### Firestore Rules

```javascript
// Allow authenticated users to read/write appointments
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Function Security

All Cloud Functions require authentication:

```javascript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
}
```

## Monitoring

### Logging

All functions include comprehensive logging:

```javascript
console.log('Creating appointment:', appointmentData);
console.error('Error creating appointment:', error);
```

### Error Tracking

Errors are properly categorized and logged for debugging.

## Conclusion

This backend implementation provides:

✅ **Complete CRUD operations** for appointments
✅ **Full data structure support** for your exact format
✅ **Comprehensive validation** and error handling
✅ **Status management** with proper transitions
✅ **History tracking** for all changes
✅ **Search and filtering** capabilities
✅ **Client information management**
✅ **Firebase Cloud Functions** for server-side processing
✅ **Type-safe data models** for structured handling
✅ **Complete examples** and documentation

The backend is ready for production use and fully supports your appointment data structure.
