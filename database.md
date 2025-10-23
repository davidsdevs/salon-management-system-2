# Database Structure Documentation

## Collections Overview

### 1. Users Collection
**Purpose**: Stores user information including staff and clients

#### Structure:
```javascript
{
  address: "Asinan, Olongapo City",           // string
  branchId: "KYiL9JprSX3LBOYzrF6e",          // string
  createdAt: "October 16, 2025 at 11:57:04 AM UTC+8", // timestamp
  email: "overhealing123@gmail.com",          // string
  firstName: "Gwyneth",                       // string
  isActive: true,                             // boolean
  lastName: "Cruz",                           // string
  middleName: "Abrajano",                     // string
  phone: "09216845557",                       // string
  roles: ["client", "stylist"],               // array of strings
  service_id: "service_beard",                // string (for stylists)
  uid: "1qOi4iF1YJOad3eEY7aiqZhxpYf1",       // string
  updatedAt: "October 16, 2025 at 11:57:04 AM UTC+8" // timestamp
}
```

#### Key Fields:
- **uid**: Unique identifier for the user
- **roles**: Array of roles (e.g., ["client", "stylist"])
- **branchId**: Branch where the user belongs
- **service_id**: Service specialization for stylists
- **isActive**: Whether the user account is active

---

### 2. Appointments Collection
**Purpose**: Stores appointment information and service-stylist assignments

#### Structure:
```javascript
{
  appointmentDate: "2025-10-24",              // string (YYYY-MM-DD)
  appointmentTime: "11:00",                   // string (HH:MM)
  branchId: "KYiL9JprSX3LBOYzrF6e",          // string
  clientId: "nglhh02J6HdlLXCMUzy3RF6qSSJ3",  // string
  clientInfo: {                               // map
    clientName: "David Devs",                 // string
    id: "nglhh02J6HdlLXCMUzy3RF6qSSJ3",      // string
    isNewClient: false,                       // boolean
    name: "David Devs"                        // string
  },
  createdAt: "October 23, 2025 at 8:59:33 AM UTC+8", // timestamp
  createdBy: "nglhh02J6HdlLXCMUzy3RF6qSSJ3", // string
  history: [                                  // array
    {
      action: "created",                      // string
      by: "nglhh02J6HdlLXCMUzy3RF6qSSJ3",    // string
      isNewClient: false,                     // boolean
      newClientEmail: "",                     // string
      newClientName: "",                      // string
      newClientPhone: "",                     // string
      notes: "Appointment created",           // string
      timestamp: "2025-10-23T00:59:31.884Z"  // string
    }
  ],
  notes: "",                                  // string
  serviceStylistPairs: [                      // array
    {
      serviceId: "service_beard",             // string
      stylistId: "1qOi4iF1YJOad3eEY7aiqZhxpYf1" // string
    },
    {
      serviceId: "service_facial",            // string
      stylistId: "4gf5AOdy4HffVillOmLu68ABgrb2" // string
    }
  ],
  status: "scheduled",                        // string
  updatedAt: "October 23, 2025 at 8:59:33 AM UTC+8" // timestamp
}
```

#### Key Fields:
- **serviceStylistPairs**: Array of service-stylist assignments
- **clientInfo**: Client information embedded in appointment
- **history**: Array of appointment history/actions
- **status**: Current appointment status
- **branchId**: Branch where appointment is scheduled

---

### 3. Services Collection
**Purpose**: Stores service information including pricing and availability

#### Structure:
```javascript
{
  branches: ["KYiL9JprSX3LBOYzrF6e"],         // array of strings
  category: "Other",                          // string
  createdAt: "October 16, 2025 at 11:07:28 AM UTC+8", // timestamp
  description: "Professional beard trimming and shaping", // string
  duration: 30,                               // number (minutes)
  id: "service_beard",                        // string
  imageURL: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop", // string
  isActive: true,                             // boolean
  isChemical: false,                          // boolean
  name: "Beard Trim",                         // string
  prices: [200],                              // array of numbers
  updatedAt: "October 16, 2025 at 11:07:28 AM UTC+8" // timestamp
}
```

#### Key Fields:
- **id**: Unique service identifier
- **name**: Display name for the service
- **prices**: Array of prices (usually one price)
- **duration**: Service duration in minutes
- **branches**: Branches where service is available
- **isActive**: Whether service is currently available

---

## Data Relationships

### User-Appointment Relationship:
- **clientId** in appointments → **uid** in users
- **stylistId** in serviceStylistPairs → **uid** in users

### Service-Appointment Relationship:
- **serviceId** in serviceStylistPairs → **id** in services

### Branch Relationships:
- All collections use **branchId** for branch-specific filtering

---

## Important Notes

1. **Roles**: Users can have multiple roles (e.g., both client and stylist)
2. **Service-Stylist Pairs**: Each appointment can have multiple services with different stylists
3. **Branch Filtering**: All data is filtered by branchId for security
4. **History Tracking**: Appointments maintain a history of all actions
5. **Active Status**: Both users and services have active/inactive status

---

## Data Access Patterns

### For Branch Managers:
- View appointments in their branch only
- See client information and service details
- Track stylist assignments per service
- Monitor appointment history and status

### For Stylists:
- View their assigned appointments only
- See service details and client information
- Update appointment status

### For Clients:
- View their own appointments only
- See service details and stylist information
- Track appointment history
