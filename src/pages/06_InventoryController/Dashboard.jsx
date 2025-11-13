import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Package, 
  Bell, 
  User, 
  Home, 
  UserCog, 
  ShoppingCart, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  ArrowRightLeft, 
  QrCode, 
  ClipboardList, 
  Truck, 
  DollarSign,
  Settings,
  FileText,
  Calendar,
  Users,
  PackageCheck
} from 'lucide-react';

const InventoryControllerDashboard = () => {
  const { userData } = useAuth();

  const menuItems = [
    { path: '/inventory/dashboard', label: 'Dashboard', icon: Home },
    { path: '/inventory/products', label: 'Products', icon: Package },
    { path: '/inventory/stocks', label: 'Stocks', icon: TrendingUp },
    { path: '/inventory/stock-transfer', label: 'Stock Transfer', icon: ArrowRightLeft },
    { path: '/inventory/upc-generator', label: 'UPC Generator', icon: QrCode },
    { path: '/inventory/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { path: '/inventory/deliveries', label: 'Deliveries', icon: PackageCheck },
    { path: '/inventory/suppliers', label: 'Suppliers', icon: Truck },
    { path: '/inventory/stock-alerts', label: 'Stock Alerts', icon: AlertTriangle },
    { path: '/inventory/reports', label: 'Reports', icon: BarChart3 },
    { path: '/inventory/cost-analysis', label: 'Cost Analysis', icon: DollarSign },
    { path: '/inventory/inventory-audit', label: 'Inventory Audit', icon: ClipboardList },
    { path: '/inventory/expiry-tracker', label: 'Expiry Tracker', icon: Calendar },
    { path: '/inventory/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Inventory Controller Dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">247</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowRightLeft className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Stock Transfer</h3>
                  <p className="text-sm text-gray-600">Transfer items between branches</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <QrCode className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">UPC Generator</h3>
                  <p className="text-sm text-gray-600">Generate barcodes for products</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-teal-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Inventory Reports</h3>
                  <p className="text-sm text-gray-600">View detailed analytics</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="ml-3 text-sm">New product added: L'Oréal Hair Color</span>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="ml-3 text-sm">Low stock alert: Shampoo Bottles</span>
              </div>
              <span className="text-xs text-gray-500">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <span className="ml-3 text-sm">Purchase order #PO-2024-001 created</span>
              </div>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
          </div>
        </Card>
        
       
        
      </div>
    </DashboardLayout>
  );
};

export default InventoryControllerDashboard;
