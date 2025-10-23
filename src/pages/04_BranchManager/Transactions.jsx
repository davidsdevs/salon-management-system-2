import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Package,
  Scissors,
  Users,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  UserCog,
  Settings,
  BarChart3,
  Receipt,
  TrendingUp,
  TrendingDown,
  Target,
  Star,
  Award,
  AlertTriangle,
  Zap,
  Activity,
  RefreshCw,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  DollarSign as Money,
  Percent,
  Timer,
  UserCheck,
  CalendarDays,
  TrendingUp as Growth,
  AlertCircle as Warning
} from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const BranchManagerTransactions = () => {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Branch Manager menu items
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/staff", label: "Staff", icon: Users },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/transactions", label: "Transactions", icon: Receipt },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: UserCog },
  ];

  // Mock data for branch-specific transactions
  const mockTransactions = [
    {
      id: 'TXN001',
      type: 'Service',
      customerName: 'Maria Santos',
      serviceName: 'Hair Cut & Style',
      stylistName: 'Ana Garcia',
      appointmentId: 'APT001',
      amount: 850,
      commission: 127.50,
      status: 'Completed',
      date: '2024-01-15T10:30:00Z',
      paymentMethod: 'Cash',
      duration: '60 mins',
      customerType: 'Regular',
      satisfaction: 5,
      items: [
        { name: 'Hair Cut & Style', price: 850, quantity: 1 }
      ]
    },
    {
      id: 'TXN002',
      type: 'Product',
      customerName: 'John Dela Cruz',
      serviceName: 'OTC Product Sale',
      stylistName: 'Carlos Reyes',
      appointmentId: null,
      amount: 450,
      commission: 67.50,
      status: 'Completed',
      date: '2024-01-15T14:15:00Z',
      paymentMethod: 'Card',
      duration: '5 mins',
      customerType: 'New',
      satisfaction: 4,
      items: [
        { name: 'L\'Oreal Professional Shampoo', price: 450, quantity: 1 }
      ]
    },
    {
      id: 'TXN003',
      type: 'Mixed',
      customerName: 'Sarah Johnson',
      serviceName: 'Color Treatment + Product',
      stylistName: 'Lisa Wong',
      appointmentId: 'APT002',
      amount: 1850,
      commission: 277.50,
      status: 'Completed',
      date: '2024-01-15T16:45:00Z',
      paymentMethod: 'Card',
      duration: '120 mins',
      customerType: 'VIP',
      satisfaction: 5,
      items: [
        { name: 'Hair Color Treatment', price: 1200, quantity: 1 },
        { name: 'Kerastase Deep Conditioning Mask', price: 650, quantity: 1 }
      ]
    },
    {
      id: 'TXN004',
      type: 'Service',
      customerName: 'Michael Brown',
      serviceName: 'Manicure & Pedicure',
      stylistName: 'Elena Rodriguez',
      appointmentId: 'APT003',
      amount: 600,
      commission: 90.00,
      status: 'Completed',
      date: '2024-01-16T09:00:00Z',
      paymentMethod: 'Cash',
      duration: '90 mins',
      customerType: 'Regular',
      satisfaction: 4,
      items: [
        { name: 'Manicure & Pedicure', price: 600, quantity: 1 }
      ]
    },
    {
      id: 'TXN005',
      type: 'Service',
      customerName: 'Jennifer Lee',
      serviceName: 'Hair Treatment Package',
      stylistName: 'Maria Santos',
      appointmentId: 'APT004',
      amount: 1200,
      commission: 180.00,
      status: 'Completed',
      date: '2024-01-16T11:30:00Z',
      paymentMethod: 'Card',
      duration: '90 mins',
      customerType: 'VIP',
      satisfaction: 5,
      items: [
        { name: 'Hair Treatment Package', price: 1200, quantity: 1 }
      ]
    },
    {
      id: 'TXN006',
      type: 'Product',
      customerName: 'Robert Wilson',
      serviceName: 'Multiple Product Sale',
      stylistName: 'Carlos Reyes',
      appointmentId: null,
      amount: 920,
      commission: 138.00,
      status: 'Completed',
      date: '2024-01-16T15:20:00Z',
      paymentMethod: 'Card',
      duration: '10 mins',
      customerType: 'Regular',
      satisfaction: 4,
      items: [
        { name: 'OPI Nail Polish', price: 450, quantity: 2 },
        { name: 'Matrix Color Sync', price: 680, quantity: 1 }
      ]
    },
    {
      id: 'TXN007',
      type: 'Service',
      customerName: 'Lisa Martinez',
      serviceName: 'Hair Coloring',
      stylistName: 'Ana Garcia',
      appointmentId: 'APT005',
      amount: 1500,
      commission: 225.00,
      status: 'Completed',
      date: '2024-01-17T10:00:00Z',
      paymentMethod: 'Card',
      duration: '150 mins',
      customerType: 'New',
      satisfaction: 5,
      items: [
        { name: 'Hair Coloring', price: 1500, quantity: 1 }
      ]
    },
    {
      id: 'TXN008',
      type: 'Service',
      customerName: 'David Kim',
      serviceName: 'Facial Treatment',
      stylistName: 'Elena Rodriguez',
      appointmentId: 'APT006',
      amount: 800,
      commission: 120.00,
      status: 'Completed',
      date: '2024-01-17T14:30:00Z',
      paymentMethod: 'Cash',
      duration: '75 mins',
      customerType: 'Regular',
      satisfaction: 4,
      items: [
        { name: 'Facial Treatment', price: 800, quantity: 1 }
      ]
    }
  ];

  // Load transactions (mock data for now)
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.stylistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'All' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || transaction.status === statusFilter;
    
    // Date filtering (simplified for demo)
    const matchesDate = dateFilter === 'All' || true; // For demo purposes
    const matchesTime = timeFilter === 'All' || true; // For demo purposes
    
    return matchesSearch && matchesType && matchesStatus && matchesDate && matchesTime;
  });

  // Get unique values for filters
  const transactionTypes = ['All', ...new Set(transactions.map(t => t.type))];
  const transactionStatuses = ['All', 'Completed', 'Pending', 'Cancelled', 'Refunded'];

  // Pagination calculations
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateFilter, timeFilter]);

  // Calculate comprehensive analytics data
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCommission = transactions.reduce((sum, t) => sum + (t.commission || 0), 0);
  const serviceRevenue = transactions.filter(t => t.type === 'Service').reduce((sum, t) => sum + (t.amount || 0), 0);
  const productRevenue = transactions.filter(t => t.type === 'Product').reduce((sum, t) => sum + (t.amount || 0), 0);
  const mixedRevenue = transactions.filter(t => t.type === 'Mixed').reduce((sum, t) => sum + (t.amount || 0), 0);
  const completedTransactions = transactions.filter(t => t.status === 'Completed').length;
  const avgTransactionValue = totalRevenue / transactions.length;
  
  // Customer analytics
  const uniqueCustomers = new Set(transactions.map(t => t.customerName)).size;
  const vipCustomers = transactions.filter(t => t.customerType === 'VIP').length;
  const newCustomers = transactions.filter(t => t.customerType === 'New').length;
  const regularCustomers = transactions.filter(t => t.customerType === 'Regular').length;
  
  // Satisfaction analytics
  const avgSatisfaction = transactions.reduce((sum, t) => sum + (t.satisfaction || 0), 0) / transactions.length;
  const highSatisfaction = transactions.filter(t => t.satisfaction >= 5).length;
  const satisfactionRate = (highSatisfaction / transactions.length) * 100;
  
  // Performance metrics
  const totalDuration = transactions.reduce((sum, t) => {
    const duration = parseInt(t.duration?.replace(' mins', '') || '0');
    return sum + duration;
  }, 0);
  const avgServiceDuration = totalDuration / transactions.filter(t => t.type === 'Service' || t.type === 'Mixed').length;
  
  // Payment method analytics
  const cashTransactions = transactions.filter(t => t.paymentMethod === 'Cash').length;
  const cardTransactions = transactions.filter(t => t.paymentMethod === 'Card').length;
  const cashRevenue = transactions.filter(t => t.paymentMethod === 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const cardRevenue = transactions.filter(t => t.paymentMethod === 'Card').reduce((sum, t) => sum + t.amount, 0);
  
  // Hourly performance (mock data for decision making)
  const hourlyPerformance = [
    { hour: '9AM', revenue: 1200, transactions: 3, efficiency: 85 },
    { hour: '10AM', revenue: 1800, transactions: 4, efficiency: 92 },
    { hour: '11AM', revenue: 2100, transactions: 5, efficiency: 88 },
    { hour: '12PM', revenue: 1500, transactions: 3, efficiency: 75 },
    { hour: '1PM', revenue: 2200, transactions: 6, efficiency: 90 },
    { hour: '2PM', revenue: 1900, transactions: 4, efficiency: 87 },
    { hour: '3PM', revenue: 2400, transactions: 5, efficiency: 94 },
    { hour: '4PM', revenue: 2100, transactions: 4, efficiency: 89 },
    { hour: '5PM', revenue: 1800, transactions: 3, efficiency: 82 },
    { hour: '6PM', revenue: 1600, transactions: 3, efficiency: 78 }
  ];
  
  // Service performance insights
  const serviceInsights = [
    { service: 'Hair Coloring', revenue: 1500, avgDuration: 150, satisfaction: 5, demand: 'High' },
    { service: 'Hair Treatment', revenue: 1200, avgDuration: 90, satisfaction: 5, demand: 'High' },
    { service: 'Hair Cut & Style', revenue: 850, avgDuration: 60, satisfaction: 5, demand: 'Very High' },
    { service: 'Facial Treatment', revenue: 800, avgDuration: 75, satisfaction: 4, demand: 'Medium' },
    { service: 'Manicure & Pedicure', revenue: 600, avgDuration: 90, satisfaction: 4, demand: 'Medium' }
  ];

  // Chart data
  const revenueByType = [
    { name: 'Services', value: serviceRevenue, color: '#3B82F6' },
    { name: 'Products', value: productRevenue, color: '#8B5CF6' },
    { name: 'Mixed', value: mixedRevenue, color: '#10B981' }
  ];

  const dailyRevenue = [
    { day: 'Mon', revenue: 4200, services: 8, products: 3 },
    { day: 'Tue', revenue: 5800, services: 12, products: 5 },
    { day: 'Wed', revenue: 6200, services: 14, products: 4 },
    { day: 'Thu', revenue: 7000, services: 16, products: 6 },
    { day: 'Fri', revenue: 8500, services: 20, products: 8 },
    { day: 'Sat', revenue: 9200, services: 22, products: 9 },
    { day: 'Sun', revenue: 6800, services: 18, products: 7 }
  ];

  const topStylists = [
    { name: 'Ana Garcia', revenue: 3200, services: 15, commission: 480 },
    { name: 'Lisa Wong', revenue: 2800, services: 12, commission: 420 },
    { name: 'Carlos Reyes', revenue: 2400, services: 10, commission: 360 },
    { name: 'Elena Rodriguez', revenue: 2100, services: 9, commission: 315 }
  ];

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Refunded': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }) => {
    const typeConfig = {
      'Service': { color: 'bg-blue-100 text-blue-800', icon: Scissors },
      'Product': { color: 'bg-purple-100 text-purple-800', icon: Package },
      'Mixed': { color: 'bg-indigo-100 text-indigo-800', icon: DollarSign }
    };
    
    const config = typeConfig[type] || typeConfig['Service'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {type}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={menuItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Transaction Reports">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* === Key Performance Indicators === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full"><DollarSign className="h-6 w-6 text-green-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-center">₱{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />+12.5% vs last week
              </p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full"><Users className="h-6 w-6 text-blue-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Unique Customers</p>
              <p className="text-2xl font-semibold text-center">{uniqueCustomers}</p>
              <p className="text-xs text-blue-600 flex items-center">
                <Star className="h-3 w-3 mr-1" />{vipCustomers} VIP customers
              </p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-full"><Star className="h-6 w-6 text-purple-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Satisfaction Rate</p>
              <p className="text-2xl font-semibold text-center">{satisfactionRate.toFixed(0)}%</p>
              <p className="text-xs text-purple-600 flex items-center">
                <Star className="h-3 w-3 mr-1" />{avgSatisfaction.toFixed(1)}/5 avg rating
              </p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-full"><Timer className="h-6 w-6 text-indigo-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Avg Service Time</p>
              <p className="text-2xl font-semibold text-center">{avgServiceDuration.toFixed(0)}m</p>
              <p className="text-xs text-indigo-600 flex items-center">
                <Activity className="h-3 w-3 mr-1" />Efficiency: 87%
              </p>
            </div>
          </Card>
        </div>

        {/* === Decision-Making Insights === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Peak Hours Analysis */}
          <Card className="p-6 shadow border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Peak Performance Hours</h3>
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="space-y-3">
              {hourlyPerformance.slice(0, 5).map((hour, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">{hour.hour}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₱{hour.revenue}</p>
                    <p className="text-xs text-gray-500">{hour.efficiency}% efficiency</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                <strong>Insight:</strong> 3PM-4PM shows highest efficiency (94%). Consider extending high-demand stylist hours.
              </p>
            </div>
          </Card>

          {/* Customer Segment Analysis */}
          <Card className="p-6 shadow border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Customer Segments</h3>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">VIP Customers</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{vipCustomers}</p>
                  <p className="text-xs text-gray-500">{((vipCustomers/uniqueCustomers)*100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Regular Customers</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{regularCustomers}</p>
                  <p className="text-xs text-gray-500">{((regularCustomers/uniqueCustomers)*100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">New Customers</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{newCustomers}</p>
                  <p className="text-xs text-gray-500">{((newCustomers/uniqueCustomers)*100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Target className="h-4 w-4 inline mr-1" />
                <strong>Action:</strong> VIP retention rate is strong. Focus on converting new customers to regulars.
              </p>
            </div>
          </Card>

          {/* Payment Method Insights */}
          <Card className="p-6 shadow border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Payment Trends</h3>
              <Money className="h-5 w-5 text-green-500" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Cash Payments</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₱{cashRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{cashTransactions} transactions</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Card Payments</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₱{cardRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{cardTransactions} transactions</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                <strong>Insight:</strong> Card payments generate higher transaction values. Consider promoting card payments for premium services.
              </p>
            </div>
          </Card>
        </div>

        {/* === Analytics Charts === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Type Pie Chart */}
          <Card className="p-6 shadow border">
            <h3 className="text-lg font-semibold mb-4">Revenue by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {revenueByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Daily Revenue Trend */}
          <Card className="p-6 shadow border">
            <h3 className="text-lg font-semibold mb-4">Weekly Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* === Performance Analysis & Action Items === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Stylists with Performance Insights */}
          <Card className="p-6 shadow border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Stylist Performance Rankings</h3>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="space-y-3">
              {topStylists.map((stylist, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index === 0 ? 'bg-yellow-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      index === 2 ? 'bg-orange-500 text-white' : 'bg-[#160B53] text-white'
                    }`}>
                      {index === 0 ? <Star className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{stylist.name}</p>
                      <p className="text-sm text-gray-500">{stylist.services} services • {((stylist.revenue/totalRevenue)*100).toFixed(1)}% of revenue</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#160B53]">₱{stylist.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">₱{stylist.commission} commission</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <Star className="h-4 w-4 inline mr-1" />
                <strong>Recommendation:</strong> Ana Garcia leads with highest revenue. Consider training other stylists on her techniques.
              </p>
            </div>
          </Card>

          {/* Service Performance Insights */}
          <Card className="p-6 shadow border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Service Performance Analysis</h3>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              {serviceInsights.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      service.demand === 'Very High' ? 'bg-red-500' :
                      service.demand === 'High' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{service.service}</p>
                      <p className="text-sm text-gray-500">{service.avgDuration} mins • {service.demand} demand</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#160B53]">₱{service.revenue.toLocaleString()}</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < service.satisfaction ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Target className="h-4 w-4 inline mr-1" />
                <strong>Action:</strong> Hair Cut & Style has highest demand. Consider adding more stylists for this service.
              </p>
            </div>
          </Card>
        </div>

        {/* === Strategic Recommendations === */}
        <Card className="p-6 shadow border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Strategic Recommendations</h3>
            <Target className="h-5 w-5 text-purple-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Revenue Optimization */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-semibold text-green-800">Revenue Optimization</h4>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Increase VIP customer base (+15% potential)</li>
                <li>• Promote premium services during peak hours</li>
                <li>• Upsell products with high-margin services</li>
                <li>• Implement loyalty program for regular customers</li>
              </ul>
            </div>

            {/* Operational Efficiency */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <Zap className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Operational Efficiency</h4>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Extend high-efficiency stylist hours (3PM-4PM)</li>
                <li>• Optimize service duration scheduling</li>
                <li>• Reduce average service time by 10%</li>
                <li>• Implement staff cross-training program</li>
              </ul>
            </div>

            {/* Customer Experience */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center mb-2">
                <Star className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-purple-800">Customer Experience</h4>
              </div>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Maintain 5-star satisfaction rating</li>
                <li>• Focus on new customer retention</li>
                <li>• Implement customer feedback system</li>
                <li>• Personalize service recommendations</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* === Filter + Actions === */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Left Side: Export Button */}
            <div className="flex-shrink-0">
              <Button
                className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" /> Export Report
              </Button>
            </div>
            
            {/* Center: Search and Filters */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <Search className="absolute left-3 top-8 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex gap-2 flex-wrap">
                {/* Type Filter */}
                <div className="min-w-[100px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    {transactionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div className="min-w-[100px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {transactionStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Right Side: Status Info */}
            <div className="flex-shrink-0">
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg whitespace-nowrap">
                Showing <span className="font-semibold text-gray-900">{paginatedTransactions.length}</span> of <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> transactions
              </div>
            </div>
          </div>
        </Card>

        {/* === Transactions Table === */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/7">
                    Customer & Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/7">
                    Stylist & Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/7">
                    Financial Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/7">
                    Customer Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/7">
                    Timing & Efficiency
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                        <p className="text-gray-500 mb-4">
                          {filteredTransactions.length === 0 
                            ? "Try adjusting your search or filter criteria"
                            : "No transactions match your current filters"
                          }
                        </p>
                        <Button
                          onClick={() => {
                            setSearchTerm('');
                            setTypeFilter('All');
                            setStatusFilter('All');
                          }}
                          className="bg-[#160B53] hover:bg-[#12094A] text-white"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            <TypeBadge type={transaction.type} />
                          </div>
                          {transaction.appointmentId && (
                            <div className="text-xs text-blue-600">
                              Apt: {transaction.appointmentId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.customerName}</div>
                        <div className="text-gray-600">{transaction.serviceName}</div>
                        {transaction.items && transaction.items.length > 1 && (
                          <div className="text-xs text-gray-500">
                            +{transaction.items.length - 1} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.stylistName}</div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transaction.customerType === 'VIP' ? 'bg-purple-100 text-purple-800' :
                            transaction.customerType === 'New' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.customerType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-semibold text-[#160B53]">
                          ₱{transaction.amount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-green-600">
                          Commission: ₱{transaction.commission?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.paymentMethod}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <StatusBadge status={transaction.status} />
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < transaction.satisfaction ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.satisfaction}/5 rating
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {transaction.duration}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {/* Top row: Items per page and page info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs text-gray-600">per page</span>
                </div>

                <div className="text-xs text-gray-600">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </div>
              </div>

              {/* Bottom row: Navigation buttons */}
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs min-w-[40px]"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs min-w-[40px]"
                >
                  Prev
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 py-1 text-xs min-w-[32px] ${
                          currentPage === pageNum 
                            ? 'bg-[#160B53] text-white' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs min-w-[40px]"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs min-w-[40px]"
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchManagerTransactions;
