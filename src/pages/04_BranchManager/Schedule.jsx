// src/pages/04_BranchManager/Schedule.jsx
import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

import {
  Users,
  UserCog,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  FileText,
  FileDown,
  Printer,
  Home,
  Calendar,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";

import {
  startOfWeek,
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";

/**
 * BranchManagerSchedules (Frontend-only, copy/paste-ready)
 *
 * Features:
 * - Summary cards
 * - Filter modal (search, role, branch, status, availability)
 * - View toggle: Daily / Weekly / Monthly
 * - Weekly view shows real dates (Mon..Sun), with Prev/Next navigation
 * - Default state: AVAILABLE for every staff/day; click the time cell itself to add/edit
 * - In-memory data only (no services)
 *
 * Keep your DashboardLayout, Card and Button components; this file expects them to exist.
 */

// static days (kept for legacy reference)
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// === SAMPLE STAFF (replace with real fetch later) ===
const staffDataSample = [
  { id: 1, name: "Marvin Santos", role: "Stylist", branch: "Subic", isActive: true, joinedAt: "2025-01-10" },
  { id: 2, name: "Lara Cruz", role: "Masseuse", branch: "Subic", isActive: true, joinedAt: "2025-03-12" },
  { id: 3, name: "Joan Dela Cruz", role: "Stylist", branch: "Subic", isActive: false, joinedAt: "2025-02-15" },
  { id: 4, name: "Ana Lim", role: "Facialist", branch: "Subic", isActive: true, joinedAt: "2025-04-20" },
  { id: 5, name: "Joy Sanchez", role: "Nail Tech", branch: "Subic", isActive: true, joinedAt: "2025-06-01" },
];

// === SAMPLE SCHEDULES (legacy day-of-week format) ===
// Only a few sample exceptions — everything else is "AVAILABLE" by default.
const sampleSchedules = [
  { id: "s1", employeeId: 1, day: "Monday", start: "09:00", end: "17:00", notes: "" },
  { id: "s2", employeeId: 2, day: "Tuesday", start: "10:00", end: "18:00", notes: "" },
  { id: "s3", employeeId: 3, day: "Wednesday", start: "08:00", end: "16:00", notes: "On-call" },
];

// menu (kept as your real code uses)
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

const BranchManagerSchedules = () => {
  const { userData } = useAuth();

  // preserved original states
  const [staffData] = useState(staffDataSample);
  const [schedules, setSchedules] = useState(sampleSchedules);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All"); // ADDED availability filter
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // calendar view state
  const [view, setView] = useState("week"); // "daily" | "week" | "month"
  const [currentDate, setCurrentDate] = useState(new Date()); // used for week/day/month navigation

  // helpers
  const roles = useMemo(() => ["All", ...Array.from(new Set(staffData.map(s => s.role)))], [staffData]);
  const branches = useMemo(() => ["All", ...Array.from(new Set(staffData.map(s => s.branch)))], [staffData]);

  // filtered staff (now includes availability)
  const filteredStaff = useMemo(() => {
    return staffData.filter(s => {
      const matchesQuery = query === "" || s.name.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "All" || s.role === roleFilter;
      const matchesBranch = branchFilter === "All" || s.branch === branchFilter;
      const matchesStatus = statusFilter === "All" || (statusFilter === "Active" ? s.isActive : !s.isActive);

      // availability: If "Available" means no schedule on the selected period (we'll interpret "today" loosely)
      let matchesAvailability = true;
      if (availabilityFilter !== "All") {
        // Determine if staff has any schedule at all (legacy schedules are day-of-week based)
        const hasAnySchedule = schedules.some(sc => sc.employeeId === s.id);
        if (availabilityFilter === "Available") matchesAvailability = !hasAnySchedule;
        if (availabilityFilter === "Busy") matchesAvailability = hasAnySchedule;
      }

      return matchesQuery && matchesRole && matchesBranch && matchesStatus && matchesAvailability;
    });
  }, [staffData, query, roleFilter, branchFilter, statusFilter, availabilityFilter, schedules]);

  // summary values
  const totalStaff = staffData.length;
  const scheduledCount = schedules.length;
  const unscheduledCount = staffData.length * DAYS.length - scheduledCount;

  const roleCounts = useMemo(() => {
    const counts = {};
    staffData.forEach(s => (counts[s.role] = (counts[s.role] || 0) + 1));
    return counts;
  }, [staffData]);

  // schedule utilities
  // NOTE: schedules stored in legacy format: day = "Monday", etc.
  const getSchedule = (employeeId, day) => schedules.find(s => s.employeeId === employeeId && s.day === day);

  // add or update schedule via prompt (simple UI for now)
  const upsertSchedule = (employeeId, day) => {
    const existing = getSchedule(employeeId, day);

    // Prompt the user for times (simple, as requested)
    const start = prompt("Start time (HH:MM)", existing?.start || "09:00");
    if (!start) return;
    const end = prompt("End time (HH:MM)", existing?.end || "17:00");
    if (!end) return;
    const notes = prompt("Notes (optional)", existing?.notes || "") || "";

    setSchedules(prev => {
      // remove old record for same employee+day (if any) then add
      const filtered = prev.filter(s => !(s.employeeId === employeeId && s.day === day));
      const newSchedule = {
        id: existing?.id || `s_${Date.now()}`,
        employeeId,
        day,
        start,
        end,
        notes,
      };
      return [...filtered, newSchedule];
    });
  };

  const removeSchedule = (employeeId, day) => {
    if (!confirm("Delete this schedule?")) return;
    setSchedules(prev => prev.filter(s => !(s.employeeId === employeeId && s.day === day)));
  };

  // export CSV (keeps your implementation)
  const exportCSV = (rows = schedules, filename = "schedules.csv") => {
    if (!rows.length) {
      alert("No data to export.");
      return;
    }
    const header = ["Employee", "Day", "Start", "End", "Notes"];
    const csv = [
      header.join(","),
      ...rows.map(r => {
        const emp = staffData.find(s => s.id === r.employeeId);
        const name = emp ? emp.name : "Unknown";
        return [`"${name}"`, r.day, r.start, r.end, `"${(r.notes || "").replace(/"/g, '""')}"`].join(",");
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // calendar helpers
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // navigation helpers
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevMonth = () => setCurrentDate(addDays(currentDate, -30));
  const nextMonth = () => setCurrentDate(addDays(currentDate, 30));
  const prevDay = () => setCurrentDate(addDays(currentDate, -1));
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const formatDate = (date, fmt = "MMM dd") => format(date, fmt);

  // quick toggle: if no schedule -> create default busy schedule; if schedule exists -> open edit
  const toggleStatus = (employeeId, day) => {
    const sc = getSchedule(employeeId, day);
    if (sc) {
      upsertSchedule(employeeId, day);
    } else {
      setSchedules(prev => [...prev, { id: `s_${Date.now()}`, employeeId, day, start: "09:00", end: "17:00", notes: "" }]);
    }
  };

  // Render headers for weekly view - user asked Monday labels bold and text-center
  const renderWeeklyHeaderDates = () =>
    weekDates.map(date => {
      const dayShort = format(date, "EEE"); // Mon, Tue...
      const dayFull = format(date, "EEEE"); // Monday
      const dateLabel = format(date, "MMM dd");
      // Bold and centered for Monday specifically (and keep consistent center for others)
      const isMonday = dayFull === "Monday";
      return (
        <th
          key={date.toISOString()}
          className={`px-6 py-3 text-center text-xs font-medium ${isMonday ? "font-bold" : ""} text-gray-500 uppercase tracking-wider`}
        >
          <div>{dayShort}</div>
          <div className="text-xs text-gray-400">{dateLabel}</div>
        </th>
      );
    });

  // Weekly body: the time cell itself is clickable. No edit/delete buttons under time.
  const renderWeeklyBody = () => (
    <>
      {filteredStaff.map(s => (
        <tr key={s.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.name}</td>

          {weekDates.map(d => {
            const dayName = format(d, "EEEE");
            const sc = getSchedule(s.id, dayName);
            return (
              <td key={`${s.id}-${dayName}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer px-3 py-2 rounded text-xs text-center w-full inline-block ${
                    sc ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-green-100 text-green-800 border border-green-200"
                  }`}
                  onClick={() => upsertSchedule(s.id, dayName)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") upsertSchedule(s.id, dayName);
                  }}
                  title={sc ? `${sc.start} - ${sc.end}${sc.notes ? ` — ${sc.notes}` : ""}` : "Click to add schedule (AVAILABLE)"}
                >
                  {sc ? `${sc.start} - ${sc.end}` : "AVAILABLE"}
                </div>
              </td>
            );
          })}

          
        </tr>
      ))}
    </>
  );

  // Daily view: card-per-stylist; clicking the body toggles edit/creates schedule
  const renderDailyView = () => {
    const dayName = format(currentDate, "EEEE");
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">{format(currentDate, "EEEE, MMMM d, yyyy")}</h3>
            <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-500">{format(currentDate, "MMM dd, yyyy")}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map(stylist => {
            const sc = getSchedule(stylist.id, dayName);
            return (
              <div key={stylist.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#160B53] flex items-center justify-center text-white font-bold text-lg">
                    {stylist.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{stylist.name}</h4>
                    <div className="text-sm text-gray-500">{stylist.role}</div>
                  </div>
                </div>

                {sc ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => upsertSchedule(stylist.id, dayName)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") upsertSchedule(stylist.id, dayName);
                    }}
                    className="p-4 rounded-lg border-2 bg-purple-100 text-purple-800 border-purple-200 cursor-pointer"
                    title={`${sc.start} - ${sc.end}${sc.notes ? ` — ${sc.notes}` : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">{sc.start} - {sc.end}</span>
                      </div>
                      <div className="text-xs text-gray-500">Tap to edit</div>
                    </div>
                    {sc.notes && <div className="text-xs text-gray-600 mt-2 p-2 bg-white bg-opacity-50 rounded">{sc.notes}</div>}
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => upsertSchedule(stylist.id, dayName)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") upsertSchedule(stylist.id, dayName);
                    }}
                    className="p-4 rounded-lg border-2 bg-green-100 text-green-800 border-green-200 cursor-pointer"
                    title="Default available - click to block time"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Available</span>
                      </div>
                      <div className="text-xs text-gray-500">Tap to block</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">9:00 AM - 5:00 PM</div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button onClick={() => upsertSchedule(stylist.id, dayName)} className="flex-1 px-3 py-2 text-sm bg-[#160B53] text-white rounded-lg">Edit</button>
                  {sc && <button onClick={() => removeSchedule(stylist.id, dayName)} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg">Delete</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Monthly view builds a simple calendar grid; legacy schedules matched by weekday name
  const renderMonthlyView = () => {
    const firstOfMonth = startOfMonth(currentDate);
    const lastOfMonth = endOfMonth(currentDate);

    const calendarStart = startOfWeek(firstOfMonth, { weekStartsOn: 1 });
    const calendarEnd = addDays(lastOfMonth, (7 - getDay(lastOfMonth || 0)) % 7);

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // build weeks
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="text-lg font-semibold text-gray-900">{format(currentDate, "MMMM yyyy")}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="text-sm text-gray-500">{format(currentDate, "MMMM yyyy")}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map(day => {
                    const dayName = format(day, "EEEE");
                    const scheduledThatDay = schedules.filter(s => s.day === dayName).length;
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                    return (
                      <td key={day.toISOString()} className={`border p-3 align-top ${isCurrentMonth ? "" : "bg-gray-50 text-gray-400"}`}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{format(day, "d")}</div>
                          <div className="text-xs text-gray-500">{scheduledThatDay} assigned</div>
                        </div>

                        <div className="mt-2 text-xs">
                          {filteredStaff.slice(0, 3).map(st => {
                            const sc = getSchedule(st.id, dayName);
                            return sc ? (
                              <div key={st.id} className="text-xxs mb-1">
                                <span className="font-medium">{st.name}</span> {sc.start}-{sc.end}
                              </div>
                            ) : null;
                          })}
                          {scheduledThatDay > 3 && <div className="text-xxs text-gray-500">+{scheduledThatDay - 3} more</div>}
                        </div>

                        <div className="mt-3">
                          <button
                            onClick={() => {
                              const empIdStr = prompt(`Enter employee ID to block time on ${format(day, "MMM d")} (example: 1)`);
                              const empId = empIdStr ? Number(empIdStr) : NaN;
                              if (!empId || !filteredStaff.find(x => x.id === empId)) {
                                alert("Invalid employee ID or not in filtered list.");
                                return;
                              }
                              upsertSchedule(empId, dayName);
                            }}
                            className="text-xs px-2 py-1 border rounded hover:bg-[#160B53] hover:text-white"
                          >
                            Block
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // main render: keep your UI and add toggles, nav, filters
  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Schedule Management">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="bg-white p-4 flex items-center gap-4 shadow-sm border border-gray-200">
    <div className="p-3 bg-blue-50 rounded-full">
      <Users className="h-6 w-6 text-blue-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Total Staff</p>
      <p className="text-2xl font-semibold text-center">{totalStaff}</p>
    </div>
  </Card>

  <Card className="bg-white p-4 flex items-center gap-4 shadow-sm border border-gray-200">
    <div className="p-3 bg-purple-50 rounded-full">
      <Calendar className="h-6 w-6 text-purple-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Scheduled Shifts (total)</p>
      <p className="text-2xl font-semibold text-center">{scheduledCount}</p>
    </div>
  </Card>

  <Card className="bg-white p-4 flex items-center gap-4 shadow-sm border border-gray-200">
    <div className="p-3 bg-yellow-50 rounded-full">
      <FileText className="h-6 w-6 text-yellow-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Unassigned Slots</p>
      <p className="text-2xl font-semibold text-center">{unscheduledCount}</p>
    </div>
  </Card>
</div>


        {/* Filter + Actions */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4" /> Filter
            </Button>

            <input
              placeholder="Search staff..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => exportCSV(schedules, "schedules_all.csv")} className="flex items-center gap-1 border bg-white text-gray-700">
              <FileDown className="h-4 w-4" /> All
            </Button>
            <Button onClick={() => {
              const filteredIds = new Set(filteredStaff.map(s => s.id));
              const rows = schedules.filter(sc => filteredIds.has(sc.employeeId));
              exportCSV(rows, "schedules_filtered.csv");
            }} className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors">
              <FileText className="h-4 w-4" /> Filtered
            </Button>
            <Button onClick={() => window.print()} className="flex items-center gap-1 border bg-white text-gray-700">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>

        {/* Filter Modal */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <h2 className="text-lg font-semibold mb-4">Filter Staff</h2>

              <input
                type="text"
                placeholder="Search name..."
                className="border rounded-md p-2 mb-3 w-full"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />

              <select className="border rounded-md p-2 mb-3 w-full" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select className="border rounded-md p-2 mb-3 w-full" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <select className="border rounded-md p-2 mb-3 w-full" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                className="border rounded-md p-2 mb-3 w-full"
                value={availabilityFilter}
                onChange={e => setAvailabilityFilter(e.target.value)}
              >
                <option value="All">All Availability</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </select>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setQuery("");
                    setRoleFilter("All");
                    setBranchFilter("All");
                    setStatusFilter("All");
                    setAvailabilityFilter("All");
                  }}
                >
                  Reset
                </Button>
                <Button className="bg-[#160B53] text-white hover:bg-[#12094A] transition-colors" onClick={() => setIsFilterOpen(false)}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW TOGGLE + NAV */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
            className={`${
                view === "daily"
                ? "bg-[#160B53] text-white hover:bg-[#160B53] hover:text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setView("daily")}
            >
            Daily
            </Button>
           <Button
  className={`${
    view === "week"
      ? "bg-[#160B53] text-white hover:bg-[#160B53] hover:text-white"
      : "bg-gray-100 hover:bg-gray-200"
  }`}
  onClick={() => setView("week")}
>
  Weekly
</Button>

<Button
  className={`${
    view === "month"
      ? "bg-[#160B53] text-white hover:bg-[#160B53] hover:text-white"
      : "bg-gray-100 hover:bg-gray-200"
  }`}
  onClick={() => setView("month")}
>
  Monthly
</Button>
          </div>

          {view === "week" && (
            <div className="flex items-center gap-2">
              <Button onClick={prevWeek}><ChevronLeft /></Button>
              <div className="text-sm text-gray-600">{formatDate(weekDates[0])} - {formatDate(weekDates[6])}</div>
              <Button onClick={nextWeek}><ChevronRight /></Button>
            </div>
          )}
        </div>

        {/* CONTENT */}
        {view === "week" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    {renderWeeklyHeaderDates()}
                    
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={weekDates.length + 2} className="px-6 py-8 text-center text-gray-500">No staff found.</td>
                    </tr>
                  ) : (
                    renderWeeklyBody()
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {view === "daily" && (
          <Card>
            <div className="p-4">
              {renderDailyView()}
            </div>
          </Card>
        )}

        {view === "month" && (
          <Card>
            <div className="p-4">
              {renderMonthlyView()}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BranchManagerSchedules;
