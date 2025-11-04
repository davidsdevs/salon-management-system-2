import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDEdH8kiG4I1y_k1l-rPzb9BKN_yEW1bEw",
  authDomain: "dsms-b1f7d.firebaseapp.com",
  projectId: "dsms-b1f7d",
  storageBucket: "dsms-b1f7d.firebasestorage.app",
  messagingSenderId: "699756198098",
  appId: "1:699756198098:web:e5f1e7d37ac9e7f39a97db",
  measurementId: "G-WTDCMHF3X3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// New users to create
const newUsers = [
  { name: 'Maria Santos', email: 'maria.santos@test.com', phone: '09171234567' },
  { name: 'Juan Dela Cruz', email: 'juan.delacruz@test.com', phone: '09181234567' },
  { name: 'Ana Reyes', email: 'ana.reyes@test.com', phone: '09191234567' },
  { name: 'Pedro Garcia', email: 'pedro.garcia@test.com', phone: '09201234567' },
  { name: 'Rosa Martinez', email: 'rosa.martinez@test.com', phone: '09211234567' }
];

// Appointment templates
const appointmentStatuses = ['pending', 'confirmed', 'in_service', 'completed'];
const appointmentTypes = ['haircut', 'coloring', 'treatment', 'styling', 'spa'];

// Helper function to get random date in the next 30 days
function getRandomDate() {
  const today = new Date();
  const daysAhead = Math.floor(Math.random() * 30);
  const date = new Date(today);
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

// Helper function to get random time slot
function getRandomTime() {
  const hours = [9, 10, 11, 13, 14, 15, 16, 17];
  const randomHour = hours[Math.floor(Math.random() * hours.length)];
  const minutes = ['00', '30'];
  const randomMinute = minutes[Math.floor(Math.random() * minutes.length)];
  return `${randomHour.toString().padStart(2, '0')}:${randomMinute}`;
}

// Helper function to get random element from array
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createNewUsers() {
  console.log('Creating 5 new test users...');
  const createdUsers = [];
  
  for (const userData of newUsers) {
    try {
      // Create auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        'TestPassword123!'
      );
      
      // Create Firestore user document
      const userDoc = {
        uid: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: 'client',
        createdAt: serverTimestamp(),
        loyaltyPoints: 0,
        loyaltyPointsByBranch: {}
      };
      
      await addDoc(collection(db, 'users'), userDoc);
      createdUsers.push({
        id: userCredential.user.uid,
        ...userDoc
      });
      
      console.log(`✓ Created user: ${userData.name}`);
    } catch (error) {
      console.log(`✗ User ${userData.email} might already exist, fetching...`);
      // If user exists, try to fetch them
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', userData.email),
        limit(1)
      );
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        createdUsers.push({
          id: userDoc.id,
          ...userDoc.data()
        });
        console.log(`✓ Fetched existing user: ${userData.name}`);
      }
    }
  }
  
  return createdUsers;
}

async function getExistingUsers() {
  console.log('Fetching 15 existing users...');
  const usersQuery = query(
    collection(db, 'users'),
    where('role', '==', 'client'),
    limit(20) // Get more than needed in case some are new users
  );
  
  const usersSnapshot = await getDocs(usersQuery);
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`✓ Found ${users.length} existing users`);
  return users;
}

async function getBranches() {
  console.log('Fetching branches...');
  const branchesSnapshot = await getDocs(collection(db, 'branches'));
  const branches = branchesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log(`✓ Found ${branches.length} branches`);
  return branches;
}

async function getServices() {
  console.log('Fetching services...');
  const servicesSnapshot = await getDocs(collection(db, 'services'));
  const services = servicesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log(`✓ Found ${services.length} services`);
  return services;
}

async function getStylists(branchId) {
  const stylistsQuery = query(
    collection(db, 'users'),
    where('role', '==', 'stylist'),
    where('branchId', '==', branchId),
    limit(5)
  );
  
  const stylistsSnapshot = await getDocs(stylistsQuery);
  const stylists = stylistsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return stylists;
}

async function createAppointment(client, branch, services, stylists) {
  const appointmentDate = getRandomDate();
  const appointmentTime = getRandomTime();
  const status = getRandomElement(appointmentStatuses);
  
  // Select 1-3 random services
  const numServices = Math.floor(Math.random() * 3) + 1;
  const selectedServices = [];
  const usedServiceIds = new Set();
  
  for (let i = 0; i < numServices; i++) {
    let service = getRandomElement(services);
    // Avoid duplicate services
    while (usedServiceIds.has(service.id) && services.length > 1) {
      service = getRandomElement(services);
    }
    usedServiceIds.add(service.id);
    
    const stylist = getRandomElement(stylists);
    selectedServices.push({
      serviceId: service.id,
      serviceName: service.name,
      stylistId: stylist?.id || null,
      stylistName: stylist?.name || 'Unassigned',
      duration: service.duration || 60,
      price: service.price || 500
    });
  }
  
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0);
  
  const appointment = {
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email || '',
    clientPhone: client.phone || '',
    branchId: branch.id,
    branchName: branch.name,
    appointmentDate,
    appointmentTime,
    services: selectedServices,
    status,
    totalDuration,
    totalAmount,
    notes: `Test appointment for ${client.name}`,
    createdAt: serverTimestamp(),
    createdBy: 'system',
    appointmentType: 'pre-booked'
  };
  
  const docRef = await addDoc(collection(db, 'appointments'), appointment);
  return { id: docRef.id, ...appointment };
}

async function seedAppointments() {
  try {
    console.log('🚀 Starting appointment seeding...\n');
    
    // 1. Create 5 new users
    const newUsersCreated = await createNewUsers();
    console.log(`\n✓ Created/fetched ${newUsersCreated.length} new users\n`);
    
    // 2. Get 15 existing users (excluding the new ones we just created)
    const allUsers = await getExistingUsers();
    const existingUsers = allUsers
      .filter(u => !newUsersCreated.find(nu => nu.id === u.id))
      .slice(0, 15);
    
    console.log(`✓ Selected ${existingUsers.length} existing users\n`);
    
    // 3. Get branches and services
    const branches = await getBranches();
    const services = await getServices();
    
    if (branches.length === 0) {
      console.error('❌ No branches found! Please create branches first.');
      return;
    }
    
    if (services.length === 0) {
      console.error('❌ No services found! Please create services first.');
      return;
    }
    
    console.log('\n📅 Creating appointments...\n');
    
    let appointmentCount = 0;
    
    // 4. Create 15 appointments for existing users
    console.log('Creating 15 appointments for existing users...');
    for (const client of existingUsers) {
      const branch = getRandomElement(branches);
      const stylists = await getStylists(branch.id);
      
      const appointment = await createAppointment(client, branch, services, stylists);
      appointmentCount++;
      console.log(`${appointmentCount}. ✓ ${client.name} - ${appointment.appointmentDate} ${appointment.appointmentTime} (${appointment.status})`);
    }
    
    // 5. Create 5 appointments for new users
    console.log('\nCreating 5 appointments for new users...');
    for (const client of newUsersCreated) {
      const branch = getRandomElement(branches);
      const stylists = await getStylists(branch.id);
      
      const appointment = await createAppointment(client, branch, services, stylists);
      appointmentCount++;
      console.log(`${appointmentCount}. ✓ ${client.name} - ${appointment.appointmentDate} ${appointment.appointmentTime} (${appointment.status})`);
    }
    
    console.log(`\n✅ Successfully created ${appointmentCount} appointments!`);
    console.log('\n📊 Summary:');
    console.log(`   - Existing users: 15 appointments`);
    console.log(`   - New users: 5 appointments`);
    console.log(`   - Total: 20 appointments`);
    
  } catch (error) {
    console.error('❌ Error seeding appointments:', error);
  }
}

// Run the seeding
seedAppointments().then(() => {
  console.log('\n🎉 Seeding complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
