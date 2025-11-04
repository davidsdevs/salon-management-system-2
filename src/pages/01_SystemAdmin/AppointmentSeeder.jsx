import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import DashboardLayout from '../shared/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react';

const AppointmentSeeder = () => {
  const { userData } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  // New users to create
  const newUsers = [
    { name: 'Maria Santos', email: 'maria.santos@test.com', phone: '09171234567' },
    { name: 'Juan Dela Cruz', email: 'juan.delacruz@test.com', phone: '09181234567' },
    { name: 'Ana Reyes', email: 'ana.reyes@test.com', phone: '09191234567' },
    { name: 'Pedro Garcia', email: 'pedro.garcia@test.com', phone: '09201234567' },
    { name: 'Rosa Martinez', email: 'rosa.martinez@test.com', phone: '09211234567' }
  ];

  const appointmentStatuses = ['pending']; // All appointments should be pending
  const TARGET_BRANCH_ID = 'KYiL9JprSX3LBOYzrF6e'; // Specific branch to use

  const getRandomDate = () => {
    const today = new Date();
    const daysAhead = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  };

  const getRandomTime = () => {
    const hours = [9, 10, 11, 13, 14, 15, 16, 17];
    const randomHour = hours[Math.floor(Math.random() * hours.length)];
    const minutes = ['00', '30'];
    const randomMinute = minutes[Math.floor(Math.random() * minutes.length)];
    return `${randomHour.toString().padStart(2, '0')}:${randomMinute}`;
  };

  const getRandomElement = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const createNewUsers = async () => {
    addLog('Creating 5 new test users...', 'info');
    const createdUsers = [];
    const auth = getAuth();
    
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
        
        addLog(`✓ Created user: ${userData.name}`, 'success');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          addLog(`✗ User ${userData.email} already exists, fetching...`, 'warning');
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
            addLog(`✓ Fetched existing user: ${userData.name}`, 'success');
          }
        } else {
          addLog(`✗ Error creating ${userData.name}: ${error.message}`, 'error');
        }
      }
    }
    
    return createdUsers;
  };

  const getExistingUsers = async () => {
    addLog('Fetching existing users...', 'info');
    
    // Try to fetch users - check both 'role' and 'roles' fields
    // Some users might have 'role' (string) and others 'roles' (array)
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter for client users (check both role and roles fields)
    let users = allUsers.filter(user => {
      // Check if user has 'client' role in either format
      if (user.role === 'client') return true;
      if (user.roles && Array.isArray(user.roles) && user.roles.includes('client')) return true;
      return false;
    });
    
    // If no client users found, use any non-admin users as fallback
    if (users.length === 0) {
      addLog('⚠️ No client users found. Using any available users...', 'warning');
      users = allUsers.filter(user => {
        // Exclude system admins
        if (user.role === 'systemAdmin') return false;
        if (user.roles && Array.isArray(user.roles) && user.roles.includes('systemAdmin')) return false;
        return true;
      });
    }
    
    users = users.slice(0, 20); // Take first 20
    
    addLog(`✓ Found ${users.length} users for appointments`, 'success');
    return users;
  };

  const getBranches = async () => {
    addLog('Fetching branches...', 'info');
    const branchesSnapshot = await getDocs(collection(db, 'branches'));
    const branches = branchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    addLog(`✓ Found ${branches.length} branches`, 'success');
    return branches;
  };

  const getServices = async () => {
    addLog('Fetching services...', 'info');
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    const services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    addLog(`✓ Found ${services.length} services`, 'success');
    return services;
  };

  const getStylists = async (branchId) => {
    const stylistsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'stylist'),
      where('branchId', '==', branchId),
      limit(5)
    );
    
    const stylistsSnapshot = await getDocs(stylistsQuery);
    return stylistsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const createAppointment = async (client, branch, services, stylists) => {
    const appointmentDate = getRandomDate();
    const appointmentTime = getRandomTime();
    const status = getRandomElement(appointmentStatuses);
    
    // Get client name with fallbacks (check multiple possible field names)
    let clientName = client.name || 
                     client.displayName || 
                     client.fullName || 
                     (client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : '') ||
                     (client.firstName ? client.firstName : '') ||
                     client.email?.split('@')[0] || 
                     'Guest User';
    
    const clientEmail = client.email || '';
    const clientPhone = client.phone || client.phoneNumber || client.contactNumber || '';
    
    const numServices = Math.floor(Math.random() * 3) + 1;
    const selectedServices = [];
    const usedServiceIds = new Set();
    
    for (let i = 0; i < numServices; i++) {
      let service = getRandomElement(services);
      while (usedServiceIds.has(service.id) && services.length > 1) {
        service = getRandomElement(services);
      }
      usedServiceIds.add(service.id);
      
      const stylist = getRandomElement(stylists);
      const stylistName = stylist?.name || stylist?.displayName || 'Unassigned';
      
      selectedServices.push({
        serviceId: service.id,
        serviceName: service.name || service.serviceName || 'Service',
        stylistId: stylist?.id || null,
        stylistName: stylistName,
        duration: service.duration || 60,
        price: service.price || 500
      });
    }
    
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0);
    
    // Ensure we have at least one service
    if (selectedServices.length === 0) {
      throw new Error('No services selected for appointment');
    }
    
    const appointment = {
      clientId: client.id,
      clientName: clientName,
      clientEmail: clientEmail,
      clientPhone: clientPhone,
      branchId: branch.id,
      branchName: branch.name || 'Branch',
      appointmentDate,
      appointmentTime,
      serviceStylistPairs: selectedServices, // Use serviceStylistPairs (required format)
      services: selectedServices, // Also keep services for backward compatibility
      status,
      totalDuration,
      totalAmount,
      notes: `Test appointment for ${clientName}`,
      createdAt: serverTimestamp(),
      createdBy: userData?.uid || 'system',
      appointmentType: 'pre-booked',
      history: [] // Initialize empty history array
    };
    
    const docRef = await addDoc(collection(db, 'appointments'), appointment);
    return { id: docRef.id, ...appointment };
  };

  const handleSeedAppointments = async () => {
    setIsSeeding(true);
    setLogs([]);
    setStats(null);

    try {
      addLog('🚀 Starting appointment seeding...', 'info');
      
      // Get 20 existing users only (no new users)
      const allUsers = await getExistingUsers();
      const existingUsers = allUsers.slice(0, 20);
      
      if (existingUsers.length < 20) {
        addLog(`⚠️ Only ${existingUsers.length} existing users found. Creating appointments for available users...`, 'warning');
      } else {
        addLog(`✓ Selected ${existingUsers.length} existing users`, 'success');
      }
      
      // Get branches and services
      const branches = await getBranches();
      const services = await getServices();
      
      if (branches.length === 0) {
        addLog('❌ No branches found! Please create branches first.', 'error');
        setIsSeeding(false);
        return;
      }
      
      if (services.length === 0) {
        addLog('❌ No services found! Please create services first.', 'error');
        setIsSeeding(false);
        return;
      }
      
      addLog('📅 Creating appointments...', 'info');
      
      // Find the target branch
      const targetBranch = branches.find(b => b.id === TARGET_BRANCH_ID);
      
      if (!targetBranch) {
        addLog(`❌ Target branch ${TARGET_BRANCH_ID} not found!`, 'error');
        setIsSeeding(false);
        return;
      }
      
      addLog(`✓ Using branch: ${targetBranch.name}`, 'success');
      
      // Get stylists for this branch
      const stylists = await getStylists(targetBranch.id);
      addLog(`✓ Found ${stylists.length} stylists for this branch`, 'success');
      
      let appointmentCount = 0;
      
      // Create appointments for all existing users at the specific branch
      for (const client of existingUsers) {
        const appointment = await createAppointment(client, targetBranch, services, stylists);
        appointmentCount++;
        addLog(`${appointmentCount}. ${appointment.clientName} - ${appointment.appointmentDate} ${appointment.appointmentTime} (${appointment.status})`, 'success');
      }
      
      setStats({
        total: appointmentCount,
        existingUsers: existingUsers.length,
        newUsers: 0
      });
      
      addLog(`✅ Successfully created ${appointmentCount} appointments!`, 'success');
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      console.error('Error seeding appointments:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <DashboardLayout role={userData?.role}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Seeder</h1>
          <p className="text-gray-600">Create pending appointments for Branch KYiL9JprSX3LBOYzrF6e using existing users</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-[#160B53]" />
              <h2 className="text-xl font-semibold">Seed Test Data</h2>
            </div>
            <Button
              onClick={handleSeedAppointments}
              disabled={isSeeding}
              className="bg-[#160B53] hover:bg-[#2D1B69] text-white"
            >
              {isSeeding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Seeding...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Create 20 Appointments
                </>
              )}
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Appointments Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.existingUsers}</div>
                <div className="text-sm text-gray-600">Existing Users Used</div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Logs:</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">Click the button above to start seeding appointments...</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm flex items-start space-x-2 ${
                      log.type === 'error' ? 'text-red-600' :
                      log.type === 'warning' ? 'text-yellow-600' :
                      log.type === 'success' ? 'text-green-600' :
                      'text-gray-700'
                    }`}
                  >
                    {log.type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {log.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ What This Does:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Selects 20 existing users from your database</li>
            <li>Creates appointments for <strong>Branch: KYiL9JprSX3LBOYzrF6e</strong></li>
            <li>All appointments set to <strong>PENDING</strong> status</li>
            <li>Random dates (next 30 days) and times (9am-5pm)</li>
            <li>Assigns 1-3 random services per appointment</li>
            <li>Links to available stylists at the branch</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentSeeder;
