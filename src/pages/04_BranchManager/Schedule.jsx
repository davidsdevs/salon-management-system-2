import React, { useState, useMemo } from 'react';
import DashboardLayout from "../shared/DashboardLayout";
import { Calendar, Users, CheckCircle, UserCheck, UserX, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const BranchManagerSchedule = () => {
  const [stylists, setStylists] = useState([
    { id: 's1', name: 'Alice Johnson', specialties: ['Cut', 'Color'], email: 'alice@example.com', phone: '123-456-7890', available: true },
    { id: 's2', name: 'Bob Smith', specialties: ['Styling'], email: 'bob@example.com', phone: '234-567-8901', available: true },
    { id: 's3', name: 'Charlie Davis', specialties: ['Perm', 'Cut'], email: 'charlie@example.com', phone: '345-678-9012', available: false },
  ]);

  const [schedules, setSchedules] = useState([
    { stylistId: 's1', date: '2025-10-16', startTime: '09:00', endTime: '17:00', status: 'busy', notes: 'Hair coloring' },
    { stylistId: 's2', date: '2025-10-16', startTime: '10:00', endTime: '15:00', status: 'available', notes: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('weekly'); // weekly, daily, staff
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingCell, setEditingCell] = useState(null);
  const [inlineForm, setInlineForm] = useState({ startTime: '', endTime: '', status: 'available', notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Calendar },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/staff", label: "Staff", icon: Users },
    { path: "/schedule", label: "Schedule", icon: Users },
  ];

  const pageTitle = "Schedule Management";

  const schedulesMap = useMemo(() => {
    const map = new Map();
    schedules.forEach(s => map.set(`${s.stylistId}_${s.date}`, s));
    return map;
  }, [schedules]);

  const getStylistSchedule = (stylistId, date) => {
    const schedule = schedulesMap.get(`${stylistId}_${date}`);
    return schedule ? [schedule] : [];
  };

  const filteredStylists = useMemo(() => {
    return stylists.filter(s => {
      const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'available' && s.available !== false) || (filterStatus === 'busy' && s.available === false);
      return matchesSearch && matchesStatus;
    });
  }, [stylists, searchTerm, filterStatus]);

  const getWeekDates = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({length:7}, (_,i)=> {
      const d = new Date(start); 
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'off': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCellClick = (stylistId, date) => {
    const existing = getStylistSchedule(stylistId, date);
    const schedule = existing.length > 0 ? existing[0] : null;
    setEditingCell({ stylistId, date });
    setInlineForm({
      startTime: schedule?.startTime || '09:00',
      endTime: schedule?.endTime || '17:00',
      status: schedule?.status || 'available',
      notes: schedule?.notes || ''
    });
  };

  const handleInlineSave = () => {
    if (!editingCell) return;
    const { stylistId, date } = editingCell;
    setSchedules(prev => {
      const newSchedules = prev.filter(s => !(s.stylistId===stylistId && s.date===date));
      if (inlineForm.status !== 'available') {
        newSchedules.push({ stylistId, date, ...inlineForm });
      }
      return newSchedules;
    });
    setEditingCell(null);
  };

  const handleInlineCancel = () => setEditingCell(null);

  // -------------------- Views --------------------
  const WeeklyView = () => {
    const weekDates = getWeekDates(currentWeek);
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={()=>setCurrentWeek(new Date(currentWeek.getTime() - 7*24*60*60*1000))}><ChevronLeft /></button>
          <span className="font-semibold">{currentWeek.toLocaleDateString('en-US', {month:'long', year:'numeric'})}</span>
          <button onClick={()=>setCurrentWeek(new Date(currentWeek.getTime() + 7*24*60*60*1000))}><ChevronRight /></button>
        </div>
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2">Stylist</th>
              {weekDates.map((d,i)=><th key={i} className="px-2 py-2 text-center">{d.toLocaleDateString('en-US',{weekday:'short', day:'numeric'})}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredStylists.map(s=>{
              return (
                <tr key={s.id}>
                  <td className="px-2 py-2">{s.name}</td>
                  {weekDates.map((d,i)=>{
                    const dateStr = d.toISOString().split('T')[0];
                    const sched = getStylistSchedule(s.id,dateStr);
                    return (
                      <td key={i} className="px-2 py-1 text-center cursor-pointer" onClick={()=>handleCellClick(s.id,dateStr)}>
                        {sched.length ? (
                          <div className={`${getStatusColor(sched[0].status)} rounded px-2 py-1`}>
                            {sched[0].startTime}-{sched[0].endTime}
                          </div>
                        ) : <div className="bg-green-100 text-green-800 px-2 py-1 rounded">Available</div>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const DailyView = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStylists.map(s=>{
          const sched = getStylistSchedule(s.id,dateStr);
          return (
            <div key={s.id} className="border rounded p-4 cursor-pointer" onClick={()=>handleCellClick(s.id,dateStr)}>
              <h4 className="font-semibold mb-2">{s.name}</h4>
              {sched.length ? (
                <div className={`${getStatusColor(sched[0].status)} px-2 py-1 rounded`}>
                  {sched[0].status} | {sched[0].startTime}-{sched[0].endTime}
                </div>
              ) : <div className="bg-green-100 text-green-800 px-2 py-1 rounded">Available 09:00-17:00</div>}
            </div>
          );
        })}
      </div>
    );
  };

  const StaffManagement = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4" />
        <input placeholder="Search stylist..." className="border p-1 rounded" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
        <select className="border p-1 rounded" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStylists.map(s=>(<div key={s.id} className="border rounded p-4">
          <h4 className="font-semibold">{s.name}</h4>
          <p>{s.email}</p>
          <p>{s.phone}</p>
          <p>{s.specialties.join(', ')}</p>
        </div>))}
      </div>
    </div>
  );

  return (
    <DashboardLayout menuItems={menuItems} pageTitle={pageTitle}>
      <div className="p-4 space-y-4">
        <div className="flex space-x-2">
          <button onClick={()=>setViewMode('weekly')} className={`${viewMode==='weekly'?'bg-blue-500 text-white':'bg-gray-100' } px-3 py-1 rounded`}>Weekly</button>
          <button onClick={()=>setViewMode('daily')} className={`${viewMode==='daily'?'bg-blue-500 text-white':'bg-gray-100' } px-3 py-1 rounded`}>Daily</button>
          <button onClick={()=>setViewMode('staff')} className={`${viewMode==='staff'?'bg-blue-500 text-white':'bg-gray-100' } px-3 py-1 rounded`}>Staff</button>
        </div>

        {loading ? <p>Loading...</p> : (
          <>
            {viewMode==='weekly' && <WeeklyView />}
            {viewMode==='daily' && <DailyView />}
            {viewMode==='staff' && <StaffManagement />}
          </>
        )}

        {editingCell && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-4 rounded w-80">
              <h4 className="font-semibold mb-2">Edit Schedule</h4>
              <div className="flex flex-col space-y-2">
                <label>Start Time</label>
                <input type="text" value={inlineForm.startTime} onChange={e=>setInlineForm({...inlineForm,startTime:e.target.value})} className="border p-1 rounded" />
                <label>End Time</label>
                <input type="text" value={inlineForm.endTime} onChange={e=>setInlineForm({...inlineForm,endTime:e.target.value})} className="border p-1 rounded" />
                <label>Status</label>
                <select value={inlineForm.status} onChange={e=>setInlineForm({...inlineForm,status:e.target.value})} className="border p-1 rounded">
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="break">Break</option>
                  <option value="off">Off</option>
                </select>
                <label>Notes</label>
                <textarea value={inlineForm.notes} onChange={e=>setInlineForm({...inlineForm,notes:e.target.value})} className="border p-1 rounded" />
                <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={handleInlineCancel} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
                  <button onClick={handleInlineSave} className="bg-blue-500 text-white px-3 py-1 rounded">{isSaving?'Saving...':'Save'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BranchManagerSchedule;
