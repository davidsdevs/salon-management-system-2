import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Home,
  Calendar,
  Users,
  Package,
  Receipt,
  Settings,
  BarChart3,
  UserCog,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  User,
  Tag,
  Calendar as CalendarIcon,
  AlertCircle,
  Search,
} from "lucide-react";

const StylistPortfolios = () => {
  const { userData } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stylists, setStylists] = useState({});
  const [selectedStylist, setSelectedStylist] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [previewImage, setPreviewImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 12;

  // Filter portfolios based on search term
  const filteredPortfolios = portfolios.filter((portfolio) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const title = portfolio.title?.toLowerCase() || "";
    const category = portfolio.category?.toLowerCase() || "";
    const stylistName = stylists[portfolio.stylistId]?.fullName?.toLowerCase() || "";
    
    return title.includes(search) || category.includes(search) || stylistName.includes(search);
  });

  // Calculate summary stats
  const summaryStats = {
    total: portfolios.length,
    pending: portfolios.filter(p => p.status === "pending").length,
    approved: portfolios.filter(p => p.status === "active").length,
    rejected: portfolios.filter(p => p.status === "rejected").length,
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/staff", label: "Staff", icon: Users },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/transactions", label: "Transactions", icon: Receipt },
    { path: "/stylist-portfolios", label: "Stylist Portfolios", icon: ImageIcon },
    { path: "/settings", label: "Settings", icon: Settings },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: UserCog },
  ];

  // Fetch stylists for the branch
  useEffect(() => {
    const fetchStylists = async () => {
      if (!userData?.branchId) return;

      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("branchId", "==", userData.branchId),
          where("roles", "array-contains", "stylist")
        );
        const snapshot = await getDocs(q);
        
        const stylistsMap = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          stylistsMap[doc.id] = {
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          };
        });
        
        setStylists(stylistsMap);
      } catch (error) {
        console.error("Error fetching stylists:", error);
        setError("Failed to load stylists");
      }
    };

    fetchStylists();
  }, [userData]);

  // Fetch portfolios
  const fetchPortfolios = async (pageNum = 1) => {
    if (!userData?.branchId) {
      console.log("❌ No branchId found in userData");
      return;
    }

    console.log("🔍 Fetching portfolios for branch:", userData.branchId);
    console.log("📊 Status filter:", statusFilter);
    console.log("👤 Selected stylist:", selectedStylist);

    try {
      setLoading(true);
      
      // Get all stylists in the branch first
      const usersRef = collection(db, "users");
      const usersQuery = query(
        usersRef,
        where("branchId", "==", userData.branchId),
        where("roles", "array-contains", "stylist")
      );
      const usersSnapshot = await getDocs(usersQuery);
      const stylistIds = usersSnapshot.docs.map((doc) => doc.id);

      console.log("✅ Found stylists in branch:", stylistIds.length, stylistIds);

      if (stylistIds.length === 0) {
        console.log("⚠️ No stylists found in this branch");
        setPortfolios([]);
        setLoading(false);
        return;
      }

      // Filter by stylist if selected
      const targetStylistIds = selectedStylist === "all" 
        ? stylistIds 
        : [selectedStylist];

      console.log("🎯 Target stylist IDs:", targetStylistIds.length, targetStylistIds);

      // Fetch all portfolios for the target stylists (no index required)
      // Firestore has a limit of 10 items for 'in' queries, so we'll batch if needed
      const batchSize = 10;
      let allPortfolios = [];

      for (let i = 0; i < targetStylistIds.length; i += batchSize) {
        const batch = targetStylistIds.slice(i, i + batchSize);
        
        console.log(`📦 Fetching batch ${i / batchSize + 1}:`, batch);
        
        // Simple query - only filter by stylistId (no composite index needed)
        const q = query(
          collection(db, "portfolio"),
          where("stylistId", "in", batch)
        );

        const snapshot = await getDocs(q);
        console.log(`✅ Batch ${i / batchSize + 1} returned:`, snapshot.docs.length, "portfolios");
        
        const portfolioData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Log each portfolio's details
        portfolioData.forEach(p => {
          console.log(`  📄 Portfolio: ${p.id} | Status: ${p.status} | Stylist: ${p.stylistId} | Title: ${p.title}`);
        });
        
        allPortfolios = [...allPortfolios, ...portfolioData];
      }

      console.log("📊 Total portfolios fetched:", allPortfolios.length);
      console.log("🔍 Before filtering - Portfolio statuses:", allPortfolios.map(p => p.status));

      // Manual filtering by status AND verify stylist belongs to branch
      const beforeFilterCount = allPortfolios.length;
      allPortfolios = allPortfolios.filter((portfolio) => {
        // Check if status matches
        if (portfolio.status !== statusFilter) {
          console.log(`  ❌ Portfolio ${portfolio.id} rejected: status "${portfolio.status}" !== "${statusFilter}"`);
          return false;
        }
        
        // Verify the stylist ID belongs to this branch
        if (!stylistIds.includes(portfolio.stylistId)) {
          console.log(`  ❌ Portfolio ${portfolio.id} rejected: stylist ${portfolio.stylistId} not in branch`);
          return false;
        }
        
        console.log(`  ✅ Portfolio ${portfolio.id} passed all filters`);
        return true;
      });

      console.log(`🔄 After filtering: ${allPortfolios.length} of ${beforeFilterCount} portfolios remain`);

      // Manual sorting by createdAt (newest first) in JavaScript
      allPortfolios.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      console.log("📅 Sorted portfolios by createdAt (newest first)");

      // Paginate
      const startIndex = (pageNum - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedPortfolios = allPortfolios.slice(startIndex, endIndex);

      console.log(`📄 Page ${pageNum}: Showing ${paginatedPortfolios.length} portfolios (${startIndex}-${endIndex} of ${allPortfolios.length})`);
      console.log("✅ Final portfolios to display:", paginatedPortfolios.map(p => ({ id: p.id, title: p.title, status: p.status })));

      setPortfolios(paginatedPortfolios);
      setTotalPages(Math.ceil(allPortfolios.length / itemsPerPage));
      setCurrentPage(pageNum);
    } catch (error) {
      console.error("❌ ERROR fetching portfolios:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      setError("Failed to load portfolios: " + error.message);
    } finally {
      console.log("🏁 Fetch complete. Loading set to false.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios(1);
  }, [userData, selectedStylist, statusFilter]);

  const handleApprove = async (portfolioId) => {
    try {
      setProcessingId(portfolioId);
      setError(null);
      setSuccessMessage(null);
      const portfolioRef = doc(db, "portfolio", portfolioId);
      await updateDoc(portfolioRef, {
        status: "active",
        approvedAt: Timestamp.now(),
        approvedBy: userData.uid,
      });
      
      setSuccessMessage("Portfolio approved successfully!");
      fetchPortfolios(currentPage);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error approving portfolio:", error);
      setError("Failed to approve portfolio: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (portfolioId) => {
    try {
      setProcessingId(portfolioId);
      setError(null);
      setSuccessMessage(null);
      const portfolioRef = doc(db, "portfolio", portfolioId);
      await updateDoc(portfolioRef, {
        status: "rejected",
        rejectedAt: Timestamp.now(),
        rejectedBy: userData.uid,
      });
      
      setSuccessMessage("Portfolio rejected successfully");
      fetchPortfolios(currentPage);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error rejecting portfolio:", error);
      setError("Failed to reject portfolio: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Stylist Portfolios">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <ImageIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Portfolios</p>
              <p className="text-2xl font-semibold text-center">{summaryStats.total}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Approval</p>
              <p className="text-2xl font-semibold text-center">{summaryStats.pending}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-center">{summaryStats.approved}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-center">{summaryStats.rejected}</p>
            </div>
          </Card>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Filter + Actions */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left Side: Filter Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search portfolios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] w-full sm:w-64"
                />
              </div>

              {/* Stylist Filter */}
              <select
                value={selectedStylist}
                onChange={(e) => setSelectedStylist(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] whitespace-nowrap"
              >
                <option value="all">All Stylists</option>
                {Object.entries(stylists).map(([id, stylist]) => (
                  <option key={id} value={id}>
                    {stylist.fullName}
                  </option>
                ))}
              </select>
              
              {/* Status Filter Dropdown */}
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] whitespace-nowrap"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="active">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Right Side: Status Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg whitespace-nowrap">
                Showing <span className="font-semibold text-gray-900">{filteredPortfolios.length}</span> of <span className="font-semibold text-gray-900">{portfolios.length}</span> portfolios
              </div>
            </div>
          </div>
        </Card>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53]"></div>
          </div>
        ) : filteredPortfolios.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No portfolios found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No portfolios match "${searchTerm}"`
                : statusFilter === "pending" 
                  ? "There are no pending portfolios waiting for approval."
                  : `No ${statusFilter} portfolios found.`}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPortfolios.map((portfolio) => (
                <Card 
                  key={portfolio.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image Preview */}
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={portfolio.thumbnailUrl || portfolio.imageUrl}
                      alt={portfolio.title}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage(portfolio)}
                    />
                    <button
                      onClick={() => setPreviewImage(portfolio)}
                      className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <Eye className="h-4 w-4 text-gray-700" />
                    </button>
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          portfolio.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : portfolio.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {portfolio.status.charAt(0).toUpperCase() + portfolio.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Portfolio Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {portfolio.title || "Untitled"}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <User className="h-4 w-4 mr-1" />
                        {stylists[portfolio.stylistId]?.fullName || "Unknown Stylist"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Tag className="h-3 w-3" />
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {portfolio.category || "Uncategorized"}
                      </span>
                    </div>

                    {portfolio.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {portfolio.description}
                      </p>
                    )}

                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {formatDate(portfolio.createdAt)}
                    </div>

                    {/* Action Buttons */}
                    {portfolio.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleApprove(portfolio.id)}
                          disabled={processingId === portfolio.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(portfolio.id)}
                          disabled={processingId === portfolio.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => fetchPortfolios(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => fetchPortfolios(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="flex items-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white transition-colors z-10"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>

              {/* Image */}
              <div className="max-h-[70vh] overflow-auto">
                <img
                  src={previewImage.imageUrl}
                  alt={previewImage.title}
                  className="w-full h-auto"
                />
              </div>

              {/* Info */}
              <div className="p-6 space-y-4 border-t">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {previewImage.title || "Untitled"}
                  </h2>
                  <p className="text-gray-600 flex items-center mt-1">
                    <User className="h-4 w-4 mr-1" />
                    {stylists[previewImage.stylistId]?.fullName || "Unknown Stylist"}
                  </p>
                </div>

                {previewImage.description && (
                  <div>
                    <p className="text-gray-700">{previewImage.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    {previewImage.category || "Uncategorized"}
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(previewImage.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {previewImage.width} × {previewImage.height}
                  </div>
                </div>

                {/* Action Buttons in Modal */}
                {previewImage.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        handleApprove(previewImage.id);
                        setPreviewImage(null);
                      }}
                      disabled={processingId === previewImage.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approve Portfolio
                    </Button>
                    <Button
                      onClick={() => {
                        handleReject(previewImage.id);
                        setPreviewImage(null);
                      }}
                      disabled={processingId === previewImage.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Reject Portfolio
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StylistPortfolios;
