import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card, Button } from "../ui/button";

const employees = ["Marvin", "Lara", "Joan", "Ana", "Joy"]; // You can fetch dynamically
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const sampleSchedules = [
  { employee: "Marvin", day: "Monday", start: "09:00", end: "17:00" },
  { employee: "Lara", day: "Tuesday", start: "10:00", end: "18:00" },
  { employee: "Joan", day: "Wednesday", start: "08:00", end: "16:00" },
  // add more sample schedules
];

const BranchManagerSchedules = () => {
  const { userData } = useAuth();
  const [schedules, setSchedules] = useState(sampleSchedules);
  const [selectedEmployee, setSelectedEmployee] = useState("All");

  const filteredEmployees = useMemo(() => {
    return selectedEmployee === "All" ? employees : [selectedEmployee];
  }, [selectedEmployee]);

  const addSchedule = (employee, day) => {
    const start = prompt("Start time (HH:MM)", "09:00");
    const end = prompt("End time (HH:MM)", "17:00");
    if (!start || !end) return;

    setSchedules(prev => [...prev, { employee, day, start, end }]);
  };

  const getScheduleForCell = (employee, day) => {
    return schedules.find(s => s.employee === employee && s.day === day);
  };

  return (
    <DashboardLayout pageTitle="Employee Schedules" menuItems={[]}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Employee Filter */}
        <div className="flex items-center gap-2">
          <label>Filter Employee: </label>
          <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="border p-2 rounded">
            <option value="All">All</option>
            {employees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
          </select>
        </div>

        {/* Calendar Grid */}
        <Card className="overflow-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="border px-4 py-2 text-left">Employee / Day</th>
                {daysOfWeek.map(day => (
                  <th key={day} className="border px-4 py-2">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(employee => (
                <tr key={employee} className="hover:bg-gray-50">
                  <td className="border px-4 py-2 font-medium">{employee}</td>
                  {daysOfWeek.map(day => {
                    const schedule = getScheduleForCell(employee, day);
                    return (
                      <td
                        key={day}
                        className="border px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => addSchedule(employee, day)}
                      >
                        {schedule ? (
                          <div className="bg-purple-100 text-purple-800 p-1 rounded text-sm text-center">
                            {schedule.start} - {schedule.end}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-center text-sm">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchManagerSchedules;
