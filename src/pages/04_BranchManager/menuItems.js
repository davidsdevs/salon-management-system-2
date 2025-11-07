import {
  Home,
  Calendar,
  Users,
  Package,
  Receipt,
  Image as ImageIcon,
  Settings,
  BarChart3,
  UserCog,
  ShoppingCart,
  DollarSign,
} from "lucide-react";

/**
 * Standardized menu items for all Branch Manager pages
 * This ensures consistent sidebar navigation across all pages
 */
export const branchManagerMenuItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/appointments", label: "Appointments", icon: Calendar },
  { path: "/staff", label: "Staff", icon: Users },
  { path: "/schedule", label: "Schedule", icon: Calendar },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/transactions", label: "Transactions", icon: Receipt },
  { path: "/branch-manager/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { path: "/branch-manager/deposits", label: "Bank Deposits", icon: DollarSign },
  { path: "/stylist-portfolios", label: "Stylist Portfolios", icon: ImageIcon },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/profile", label: "Profile", icon: UserCog },
];

