# David's Salon Management System - Setup Instructions

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Git

## Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Authentication**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Optionally enable other providers as needed

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (we'll update rules later)
   - Select a location for your database

4. **Get Firebase Configuration**
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click "Web app" icon to add a web app
   - Copy the Firebase configuration object

5. **Set Environment Variables**
   - Create a `.env` file in the project root
   - Add your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd salon-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase rules**
   - Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## Initial Setup

1. **Create System Admin User**
   - Register a new account through the web interface (will be created as a client)
   - Manually update the user's role in Firestore to "systemAdmin"
   - Or use Firebase Console to create the first admin user directly
   - **Note**: Only clients can self-register. All staff accounts must be created by administrators.

2. **Create Branches**
   - Use the admin dashboard to create branches
   - Assign branch IDs to users

3. **Create Staff Accounts**
   - Use the admin dashboard to create staff accounts
   - Assign appropriate roles and branch assignments
   - Staff cannot self-register for security reasons

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── admin/          # Admin dashboard components
│   ├── dashboard/      # Main dashboard
│   ├── profile/        # User profile management
│   └── ui/             # Reusable UI components
├── context/            # React context providers
├── services/           # API services
├── utils/              # Utility functions
└── lib/                # Firebase configuration
```

## User Roles

- **System Admin**: Full system access
- **Franchise Owner**: Multi-branch oversight
- **Branch Admin**: Branch-level management
- **Branch Manager**: Daily operations oversight
- **Receptionist**: Front-desk operations
- **Inventory Controller**: Stock management
- **Stylist**: Service provider
- **Client**: Customer access

## Security Features

- Role-based access control
- Firebase Authentication
- Firestore Security Rules
- Input validation
- Audit logging

## Development

1. **Adding New Features**
   - Follow the existing component structure
   - Use the established patterns for services and context
   - Update Firebase rules as needed

2. **Testing**
   - Test authentication flows
   - Verify role-based access
   - Check security rules

## Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy
   ```

## Troubleshooting

### Common Issues

1. **Firebase configuration errors**
   - Check environment variables
   - Verify Firebase project settings

2. **Authentication issues**
   - Check Firebase Auth settings
   - Verify email/password provider is enabled

3. **Permission errors**
   - Check Firestore security rules
   - Verify user roles in database

### Support

For issues and questions:
- Check Firebase documentation
- Review Firestore security rules
- Test authentication flows

## Next Steps

After completing Scope 1 (User & Role Management):
- Scope 2: Branch Management
- Scope 3: Appointment Scheduling
- Scope 4: Billing & POS
- Scope 5: Inventory Control
