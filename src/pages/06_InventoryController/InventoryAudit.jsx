import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
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
  Users
} from 'lucide-react';

const InventoryAudit = () => {
  const { userData } = useAuth();

  const menuItems = [
    { path: '/inventory/dashboard', label: 'Dashboard', icon: Home },
    { path: '/inventory/products', label: 'Products', icon: Package },
    { path: '/inventory/stocks', label: 'Stocks', icon: TrendingUp },
    { path: '/inventory/stock-transfer', label: 'Stock Transfer', icon: ArrowRightLeft },
    { path: '/inventory/upc-generator', label: 'UPC Generator', icon: QrCode },
    { path: '/inventory/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { path: '/inventory/suppliers', label: 'Suppliers', icon: Truck },
    { path: '/inventory/stock-alerts', label: 'Stock Alerts', icon: AlertTriangle },
    { path: '/inventory/reports', label: 'Reports', icon: BarChart3 },
    { path: '/inventory/cost-analysis', label: 'Cost Analysis', icon: DollarSign },
    { path: '/inventory/inventory-audit', label: 'Inventory Audit', icon: ClipboardList },
    { path: '/inventory/expiry-tracker', label: 'Expiry Tracker', icon: Calendar },
    { path: '/inventory/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Inventory Audit">
      <div className="max-w-7xl mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Inventory Audit</h1>
          <p className="text-gray-600">Conduct regular inventory audits and stock counts.</p>
          
          {/* Content will be added here */}
          <div className="mt-8 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Inventory audit functionality coming soon...</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InventoryAudit;
