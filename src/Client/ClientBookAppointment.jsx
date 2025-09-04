import React, { useState, useEffect } from "react";
import SidebarWithHeader from "./common/components/SidebarWithHeader.jsx";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ClientBookAppointment() {
  const { userProfile } = useAuth();

  const userInfo = {
    name: userProfile?.firstName || "Client",
    subtitle: userProfile?.email || "Salon Client",
    badge: "Client",
    profileImage: userProfile?.profileImage || "./placeholder.svg",
  };

  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branch, setBranch] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableStylists, setAvailableStylists] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const serviceWorkloads = {
    Haircut: { workload: 3, price: 200 },
    Color: { workload: 1, price: 500 },
    Shampoo: { workload: 1, price: 100 },
    Treatment: { workload: 2, price: 350 },
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const snapshot = await getDocs(collection(db, "branches"));
        const branchList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBranches(branchList);
        console.log("Branches fetched:", branchList);
      } catch (err) {
        console.error("Error fetching branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const fetchAvailableStylists = async (branchId, selectedDate) => {
    try {
      if (!branchId || !selectedDate) return [];

      const weekday = new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" });
      console.log("Fetching stylists for weekday:", weekday, "branch:", branchId);

      const staffSnap = await getDocs(
        query(collection(db, "staff_accounts"), where("branch_id", "==", branchId))
      );
      const staffAccounts = staffSnap.docs.map(doc => ({ staff_id: doc.id.trim(), ...doc.data() }));
      console.log("Staff accounts fetched:", staffAccounts);
      if (staffAccounts.length === 0) return [];

      const branchServicesSnap = await getDocs(
        query(collection(db, "branch_services"), where("branch_id", "==", branchId))
      );
      const branchServices = branchServicesSnap.docs.map(doc => ({
        branch_service_id: doc.id.trim(),
        ...doc.data()
      }));
      console.log("Branch services fetched:", branchServices);

      const serviceIds = [...new Set(branchServices.map(bs => bs.service_id))];
      const servicesMap = {};
      if (serviceIds.length > 0) {
        const servicesSnap = await getDocs(
          query(collection(db, "services"), where("__name__", "in", serviceIds))
        );
        servicesSnap.docs.forEach(doc => {
          servicesMap[doc.id] = doc.data();
        });
      }
      console.log("Services fetched:", servicesMap);

      const available = [];

      for (let staff of staffAccounts) {
        console.log("Processing staff:", staff.staff_id);

        const schedSnap = await getDocs(
          query(
            collection(db, "staff_schedules"),
            where("staff_id", "==", staff.staff_id),
            where("day_of_week", "==", weekday)
          )
        );
        const schedules = schedSnap.docs.map(d => d.data());
        console.log(`Schedules fetched for staff ${staff.staff_id}:`, schedules);
        if (schedules.length === 0) continue;

        let fullName = staff.name || "";
        if (staff.users_id) {
          try {
            const userDoc = await getDoc(doc(db, "users", staff.users_id));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              fullName = `${userData.firstName} ${userData.lastName}`;
            }
          } catch (err) {
            console.error("Error fetching user data:", err);
          }
        }

        const staffServicesSnap = await getDocs(
          query(collection(db, "staff_services"), where("staff_id", "==", staff.staff_id))
        );
        const staffBranchServiceIds = staffServicesSnap.docs.map(doc => doc.data().branch_service_id.trim());
        console.log(`Staff services fetched for ${fullName}:`, staffBranchServiceIds);

        const servicesOffered = staffBranchServiceIds
          .map(bsId => {
            const branchService = branchServices.find(bs => bs.branch_service_id === bsId);
            if (!branchService) return null;
            const svcDetails = servicesMap[branchService.service_id];
            if (!svcDetails) return null;
            return {
              name: svcDetails.name,
              description: svcDetails.description,
              default_price: svcDetails.default_price,
              discounted_price: branchService.branch_discounted_price || null,
              workload_units: svcDetails.workload_units
            };
          })
          .filter(Boolean);

        available.push({
          name: fullName,
          position: staff.position || "Stylist",
          remaining: schedules[0].workload_maximum,
          services: servicesOffered
        });
      }

      console.log("Available stylists:", available);
      return available;
    } catch (err) {
      console.error("Error fetching schedules:", err);
      return [];
    }
  };

  useEffect(() => {
    if (!date || !branch) {
      setAvailableStylists([]);
      return;
    }

    fetchAvailableStylists(branch.id, date).then(stylists => {
      setAvailableStylists(stylists);
    });
  }, [date, branch]);

  const toggleService = (stylistName, service) => {
    setSelectedServices(prev => {
      const current = prev[stylistName] || [];
      if (current.includes(service)) {
        return { ...prev, [stylistName]: current.filter(s => s !== service) };
      } else {
        return { ...prev, [stylistName]: [...current, service] };
      }
    });
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(selectedServices).forEach(svcArr => {
      svcArr.forEach(svc => {
        total += serviceWorkloads[svc]?.price || 0;
      });
    });
    return total;
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const steps = ["Branch", "Date", "Service & Stylist"];

  return (
    <SidebarWithHeader userInfo={userInfo} pageTitle="Book Appointment">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">Book Your Appointment</h1>

        <div className="flex items-center justify-between mb-8">
          {steps.map((label, idx) => (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
                step === idx + 1
                  ? "bg-[#160B53] text-white border-[#160B53]"
                  : step > idx + 1
                  ? "bg-[#160B53] text-white border-[#160B53]"
                  : "border-gray-300 text-gray-400"
              }`}>{idx + 1}</div>
              <span className="text-sm mt-2">{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-6">

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Choose a Branch</h2>
              {loadingBranches ? (
                <p className="text-gray-500">Loading branches...</p>
              ) : (
                <div className="space-y-3">
                  {branches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setBranch({ id: b.id, name: b.branch_name })}
                      className={`w-full p-3 border rounded-lg ${
                        branch?.name === b.branch_name
                          ? "border-[#160B53] bg-[#160B53]/10"
                          : "border-gray-300"
                      }`}
                    >
                      {b.branch_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Select Date</h2>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded p-2 mb-6"
              />
              {date && (
                <div className="mt-2 mb-2">
                  {availableStylists.length === 0 ? (
                    <div className="border border-red-500 bg-red-100 text-red-600 font-semibold rounded p-3 text-sm">
                      No stylists scheduled for this day.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableStylists.map((stylist, idx) => (
                        <div key={idx} className="w-full border border-blue-300 bg-blue-50 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{stylist.name}</span>
                            <span className="text-sm text-gray-500">{stylist.position || "Stylist"}</span>
                          </div>
                          {stylist.services && stylist.services.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2">
                              {stylist.services.map((svc, i) => (
                                <div key={i} className="w-full bg-white border border-gray-200 rounded-lg p-2 flex flex-col md:flex-row md:justify-between text-sm">
                                  <div>
                                    <span className="font-medium">{svc.name}</span>
                                    <p className="text-gray-500 text-xs">{svc.description}</p>
                                  </div>
                                  <div className="flex flex-col items-end mt-1 md:mt-0">
                                    <span className="text-blue-700 font-semibold">₱{svc.default_price}</span>
                                    <span className="text-gray-500 text-xs">Workload: {svc.workload_units}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 text-sm text-blue-700">Remaining workload: {stylist.remaining}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Select Service & Stylist</h2>
              {availableStylists.length === 0 ? (
                <p className="text-gray-500">No stylists available from Step 2.</p>
              ) : (
                <div className="space-y-4">
                  {availableStylists.map((s, i) => (
                    <div key={i} className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                      <span className="font-semibold text-gray-900">{s.name}</span> – Remaining: {s.remaining}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {s.services.map((svc, idx) => {
                          const isSelected = selectedServices[s.name]?.includes(svc) || false;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleService(s.name, svc)}
                              className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                                isSelected
                                  ? "bg-[#160B53] text-white border-[#160B53]"
                                  : "bg-white text-gray-700 border-gray-300"
                              }`}
                            >
                              {svc} – ₱{serviceWorkloads[svc]?.price}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 p-4 border rounded-xl bg-gray-50 shadow-sm">
                <h3 className="font-semibold mb-2 text-lg">Summary</h3>
                {Object.keys(selectedServices).length === 0 ? (
                  <p className="text-gray-500 text-sm">No services selected yet.</p>
                ) : (
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {Object.entries(selectedServices).map(([stylist, services]) =>
                      services.map((svc, idx) => (
                        <li key={stylist + idx}><span className="font-semibold">{stylist}</span> – {svc} (₱{serviceWorkloads[svc]?.price})</li>
                      ))
                    )}
                  </ul>
                )}
                <p className="mt-3 font-semibold text-gray-900">Total: ₱{calculateTotal().toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 && <button onClick={prevStep} className="px-4 py-2 rounded border border-gray-200 text-gray-700">Previous</button>}
            {step === 1 && <button onClick={nextStep} className="ml-auto px-4 py-2 rounded bg-[#160B53] text-white" disabled={!branch}>Next</button>}
            {step === 2 && <button onClick={nextStep} className="ml-auto px-4 py-2 rounded bg-[#160B53] text-white" disabled={availableStylists.length === 0 || !date}>Continue</button>}
            {step === 3 && <button onClick={() => setShowConfirmModal(true)} className="ml-auto px-4 py-2 rounded bg-[#160B53] text-white" disabled={Object.keys(selectedServices).length === 0}>Confirm Booking</button>}
          </div>

          {showConfirmModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-[420px] max-w-full p-6 flex flex-col items-center">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-green-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Confirm Your Booking</h2>
                <p className="text-sm text-gray-600 mb-4 text-center">Please review your selections. This is an <span className="font-semibold text-gray-800">initial estimate</span>.</p>
                <div className="bg-gray-50 rounded-lg p-4 shadow-inner text-sm space-y-3 w-full">
                  <p><span className="font-medium">Branch:</span> {branch?.name}</p>
                  <p><span className="font-medium">Date:</span> {new Date(date).toDateString()}</p>
                  <div>
                    <span className="font-medium">Services:</span>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                      {Object.entries(selectedServices).map(([stylist, services]) =>
                        services.map((svc, idx) => (
                          <li key={stylist + idx}>{svc} with {stylist} (₱{serviceWorkloads[svc]?.price})</li>
                        ))
                      )}
                    </ul>
                  </div>
                  <p className="mt-2 font-bold text-gray-900">Total: ₱{calculateTotal().toLocaleString()}</p>
                </div>
                <div className="flex justify-end gap-3 mt-6 w-full">
                  <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                  <button onClick={() => {
                    console.log("Final booking payload:", { branch, date, time, selectedServices, total: calculateTotal() });
                    setShowConfirmModal(false);
                    alert("Booking confirmed! (Firestore save goes here)");
                  }} className="px-4 py-2 rounded-lg bg-[#160B53] text-white font-medium hover:bg-[#120944] transition">Confirm Booking</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </SidebarWithHeader>
  );
}
