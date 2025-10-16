/**
 * seed_staff_schedules.js
 * Seeds Firestore 'staff_schedules' collection using Firebase Admin SDK.
 * Run: node seed_staff_schedules.js
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync("./serviceKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// === Seed Data ===
const schedules = [
  {
    stylistId: "",       // leave blank
    branchId: "",        // leave blank
    date: "2025-10-12",
    startTime: "09:00",
    endTime: "10:00",
    status: "busy",
    notes: "busy",
  },
  {
    stylistId: "",
    branchId: "",
    date: "2025-10-12",
    startTime: "10:30",
    endTime: "11:30",
    status: "busy",
    notes: "busy",
  },
  {
    stylistId: "",
    branchId: "",
    date: "2025-10-13",
    startTime: "13:00",
    endTime: "15:00",
    status: "busy",
    notes: "busy",
  },
];

// === Seeder Function ===
async function seedStaffSchedules() {
  try {
    const batch = db.batch();

    for (const schedule of schedules) {
      const ref = db.collection("staff_schedules").doc(); // auto-generated ID
      batch.set(ref, {
        ...schedule,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log("✅ Staff schedules successfully seeded!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding staff schedules:", error);
    process.exit(1);
  }
}

seedStaffSchedules();
