import React, { useState, useEffect } from "react";
import SidebarWithHeader from "./common/components/SidebarWithHeader.jsx";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";


export default function ClientBookAppointment() {
  const { userProfile } = useAuth();

  const userInfo = {
    name: userProfile?.firstName || "Client",
    subtitle: userProfile?.email || "Salon Client",
    badge: "Client",
    profileImage: userProfile?.profileImage || "./placeholder.svg",
  };

  // Step states
  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branch, setBranch] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Step 3 states
  const [availableStylists, setAvailableStylists] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});

  // Service list with workloads + prices
  const serviceWorkloads = {
    Haircut: { workload: 3, price: 200 },
    Color: { workload: 1, price: 500 },
    Shampoo: { workload: 1, price: 100 },
    Treatment: { workload: 2, price: 350 },
  };

  // Fetch branches from Firestore
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "branches"));
        const branchList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBranches(branchList);
      } catch (err) {
        console.error("Error fetching branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const steps = ["Branch", "Date & Time", "Service & Stylist"];

  // 🔹 Recalculate available stylists whenever date/time changes
  useEffect(() => {
    if (!date || !time) {
      setAvailableStylists([]);
      return;
    }

    const staffSchedules = {
      Monday: ["Sean", "Francis"],
      Tuesday: ["Sean", "Anna"],
      Wednesday: ["Francis"],
      Thursday: ["Sean"],
      Friday: ["Anna", "Francis"],
    };

    const stylistServices = {
      Sean: ["Haircut", "Color"],
      Francis: ["Haircut", "Shampoo", "Color"],
      Anna: ["Color", "Treatment"],
    };

    const appointments = {
      "2025-09-05_10:00_Sean": ["Haircut"],
      "2025-09-05_10:00_Francis": ["Shampoo", "Color"],
      "2025-09-07_14:00_Anna": ["Color", "Treatment"],
      "2025-09-06_11:00_Sean": ["Color"],
      "2025-09-06_12:00_Francis": ["Haircut", "Shampoo"],
      "2025-09-08_09:00_Anna": ["Treatment"],
    };

    const weekday = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    const scheduledStylists = staffSchedules[weekday] || [];

    const availableStylistsCalc = scheduledStylists
      .map((stylist) => {
        const bookedKey = `${date}_${time}_${stylist}`;
        const bookedServices = appointments[bookedKey] || [];

        const currentWorkload = bookedServices.reduce(
          (sum, svc) => sum + (serviceWorkloads[svc]?.workload || 0),
          0
        );

        const remaining = 5 - currentWorkload;

        const possibleServices = (stylistServices[stylist] || []).filter(
          (svc) => serviceWorkloads[svc].workload < remaining
        );

        return {
          name: stylist,
          remaining,
          services: possibleServices,
        };
      })
      .filter((s) => s.remaining > 0 && s.services.length > 0);

    setAvailableStylists(availableStylistsCalc);
  }, [date, time]);

  // Toggle service selection
  const toggleService = (stylist, service) => {
    setSelectedServices((prev) => {
      const current = prev[stylist] || [];
      if (current.includes(service)) {
        return {
          ...prev,
          [stylist]: current.filter((s) => s !== service),
        };
      } else {
        return {
          ...prev,
          [stylist]: [...current, service],
        };
      }
    });
  };

  // Calculate total
  const calculateTotal = () => {
    let total = 0;
    Object.values(selectedServices).forEach((services) => {
      services.forEach((svc) => {
        total += serviceWorkloads[svc]?.price || 0;
      });
    });
    return total;
  };

  //THE DIALOG MODAL FOR CONFIRMING BOOKING.
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <SidebarWithHeader userInfo={userInfo} pageTitle="Book Appointment">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">
          Book Your Appointment
        </h1>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((label, idx) => (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
                  step === idx + 1
                    ? "bg-[#160B53] text-white border-[#160B53]"
                    : step > idx + 1
                    ? "bg-[#160B53] text-white border-[#160B53]"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {idx + 1}
              </div>
              <span className="text-sm mt-2">{label}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl shadow p-6">
          {/* STEP 1: Choose Branch */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Choose a Branch</h2>
              {loadingBranches ? (
                <p className="text-gray-500">Loading branches...</p>
              ) : (
                <div className="space-y-3">
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() =>
                        setBranch({ id: b.id, name: b.branch_name })
                      }
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

          {/* STEP 2: Date & Time */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Select Date & Time</h2>

              {/* Select Date */}
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded p-2 mb-4"
              />

              {/* Select Time */}
              <input
                type="time"
                value={time}
                step="3600"
                onChange={(e) => {
                  let val = e.target.value;
                  if (val) {
                    const [hh] = val.split(":");
                    val = `${hh.padStart(2, "0")}:00`;
                  }
                  setTime(val);
                }}
                className="w-full border rounded p-2 mb-4"
              />

              {/* Availability */}
              {date && time && (
                <div className="mt-2 mb-2">
                  {availableStylists.length === 0 ? (
                    <div className="border border-red-500 bg-red-100 text-red-600 font-semibold rounded p-3 text-sm">
                      No available stylists for this time slot.
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-md border border-blue-300 bg-blue-50 p-4 mb-4">
                      <div className="text-sm text-blue-800">
                        <h3 className="font-semibold mb-2">
                          Available Stylists
                        </h3>
                        <ul className="space-y-2">
                          {availableStylists.map((s, i) => (
                            <li key={i}>
                              <span className="font-semibold text-gray-900">
                                {s.name}
                              </span>{" "}
                              – Remaining workload: {s.remaining}
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {s.services.map((svc, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full"
                                  >
                                    {svc}
                                  </span>
                                ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Select Service & Stylist */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Select Service & Stylist
              </h2>

              {availableStylists.length === 0 ? (
                <p className="text-gray-500">
                  No stylists carried over from Step 2.
                </p>
              ) : (
                <div className="space-y-4">
                  {availableStylists.map((s, i) => (
                    <div
                      key={i}
                      className="border border-blue-200 bg-blue-50 rounded-xl p-4"
                    >
                      <span className="font-semibold text-gray-900">
                        {s.name}
                      </span>{" "}
                      – Remaining workload: {s.remaining}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {s.services.map((svc, idx) => {
                          const isSelected =
                            selectedServices[s.name]?.includes(svc) || false;
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
                              {svc} – ₱{serviceWorkloads[svc].price}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 p-4 border rounded-xl bg-gray-50 shadow-sm">
                <h3 className="font-semibold mb-2 text-lg">Summary</h3>
                {Object.keys(selectedServices).length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No services selected yet.
                  </p>
                ) : (
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {Object.entries(selectedServices).map(
                      ([stylist, services]) =>
                        services.map((svc, idx) => (
                          <li key={stylist + idx}>
                            <span className="font-semibold">{stylist}</span> –{" "}
                            {svc} (₱{serviceWorkloads[svc]?.price})
                          </li>
                        ))
                    )}
                  </ul>
                )}
                <p className="mt-3 font-semibold text-gray-900">
                  Total: ₱{calculateTotal().toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-red-600">
                  Important: This is an initial/estimated cost only. The final
                  price will be determined at the salon based on the condition
                  of your hair, nails, etc., and any additional services or
                  products used.
                </p>
              </div>

              
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 1 && step < 4 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded border border-gray-200 text-gray-700"
              >
                Previous
              </button>
            )}

            {step === 1 && (
              <button
                onClick={nextStep}
                className="ml-auto px-4 py-2 rounded bg-[#160B53] text-white"
                disabled={!branch}
              >
                Next
              </button>
            )}

            {step === 2 && date && time && (
              <button
                onClick={nextStep}
                className="ml-auto px-4 py-2 rounded bg-[#160B53] text-white"
                disabled={availableStylists.length === 0}
              >
                Continue to Select Service & Stylist
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="ml-auto px-4 py-2 rounded bg-[#160B53] text-white hover:bg-[#120944] transition"

                disabled={Object.keys(selectedServices).length === 0}
              >
                Confirm Booking
              </button>
            )}
          </div>
        </div>
    {/* Confirmation Modal */}
{showConfirmModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-[420px] max-w-full p-6 flex flex-col items-center">
      
      {/* Green Check Icon */}
      <div className="h-14 w-14 flex items-center justify-center rounded-full bg-green-100 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
        Confirm Your Booking
      </h2>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Please review your selections. This is an{" "}
        <span className="font-semibold text-gray-800">initial estimate</span>.
      </p>

      {/* Details */}
      <div className="bg-gray-50 rounded-lg p-4 shadow-inner text-sm space-y-3 w-full">
        <p>
          <span className="font-medium">Branch:</span> {branch?.name}
        </p>
        <p>
          <span className="font-medium">Date & Time:</span>{" "}
          {new Date(`${date}T${time}`).toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
        <div>
          <span className="font-medium">Services:</span>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
            {Object.entries(selectedServices).map(([stylist, services]) =>
              services.map((svc, idx) => (
                <li key={stylist + idx}>
                  {svc} with {stylist}{" "}
                  <span className="text-gray-500">
                    (₱{serviceWorkloads[svc]?.price})
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <p className="mt-2 font-bold text-gray-900">
          Total: ₱{calculateTotal().toLocaleString()}
        </p>
        <p className="text-xs text-red-600 leading-snug">
          Important: This is an initial/estimated cost only. The final price
          will be determined at the salon based on the condition of your hair,
          nails, etc., and any additional services or products used.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 w-full">
        <button
          onClick={() => setShowConfirmModal(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            console.log("Final booking payload:", {
              branch,
              date,
              time,
              selectedServices,
              total: calculateTotal(),
            });
            setShowConfirmModal(false);
            alert("Booking confirmed! (Firestore save goes here)");
          }}
          className="px-4 py-2 rounded-lg bg-[#160B53] text-white font-medium hover:bg-[#120944] transition"
        >
          Confirm Booking
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </SidebarWithHeader>
  );
}
