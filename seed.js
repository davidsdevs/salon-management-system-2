/**
 * Seed script for Firestore + Firebase Auth
 * Run with: node seed.js
*/

const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Helpers
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

async function seed() {
  try {
    /** USERS + Firebase Auth **/
    const userIds = [];
    for (let i = 1; i <= 10; i++) {
      const userRecord = await admin.auth().createUser({
        email: `user${i}@mail.com`,
        password: "password123", // same password for testing
        displayName: `User ${i}`,
      });

      await db.collection("users").doc(userRecord.uid).set({
        name: userRecord.displayName,
        email: userRecord.email,
        profileImage: null,
      });

      userIds.push(userRecord.uid);
    }

    /** CLIENT ACCOUNTS **/
    const clientCategories = ["X", "TR", "R"];
    for (let i = 0; i < 10; i++) {
      await db.collection("client_accounts").add({
        user_id: userIds[i],
        category: randomItem(clientCategories),
        status: "active",
        agreeToPromotions: Math.random() > 0.5,
        termsAccepted: true,
      });
    }

    /** BRANCHES **/
    const branchIds = [];
    for (let i = 1; i <= 10; i++) {
      const branchRef = db.collection("branches").doc();
      await branchRef.set({
        branch_name: `Branch ${i}`,
        address: `Address ${i}, City`,
        phone: `+63-91234567${i}`,
      });
      branchIds.push(branchRef.id);
    }

    /** SERVICES **/
    const services = [
      { name: "Haircut", description: "Basic haircut", default_price: 300, workload_units: 5 },
      { name: "Hair Color", description: "Full coloring", default_price: 1500, workload_units: 3 },
      { name: "Rebond", description: "Hair rebonding", default_price: 2500, workload_units: 3 },
      { name: "Blow Dry", description: "Quick dry", default_price: 200, workload_units: 1 },
      { name: "Shampoo", description: "Shampoo wash", default_price: 100, workload_units: 1 },
    ];

    const serviceIds = [];
    for (let s of services) {
      const serviceRef = db.collection("services").doc();
      await serviceRef.set(s);
      serviceIds.push(serviceRef.id);
    }

    /** BRANCH SERVICES **/
    const branchServiceIds = [];
    for (let b of branchIds) {
      for (let s of serviceIds) {
        const branchServiceRef = db.collection("branch_services").doc();
        await branchServiceRef.set({
          branch_id: b,
          service_id: s,
          price_override: Math.random() > 0.5 ? Math.floor(Math.random() * 2000 + 200) : null,
          availability: true,
        });
        branchServiceIds.push(branchServiceRef.id);
      }
    }

    /** STAFF ACCOUNTS **/
    const staffIds = [];
    for (let i = 1; i <= 10; i++) {
      const staffRecord = await admin.auth().createUser({
        email: `staff${i}@mail.com`,
        password: "password123",
        displayName: `Staff ${i}`,
      });

      await db.collection("users").doc(staffRecord.uid).set({
        name: staffRecord.displayName,
        email: staffRecord.email,
        profileImage: null,
      });

      const staffRef = db.collection("staff_accounts").doc();
      await staffRef.set({
        user_id: staffRecord.uid,
        branch_id: randomItem(branchIds),
        role: "Stylist",
      });

      staffIds.push(staffRef.id);
    }

    /** STAFF SCHEDULES **/
    for (let staff of staffIds) {
      for (let i = 0; i < 3; i++) {
        await db.collection("staff_schedules").add({
          staff_id: staff,
          day_of_week: randomItem(days),
          start_time: "09:00",
          end_time: "17:00",
        });
      }
    }

    /** STAFF SERVICES **/
    for (let staff of staffIds) {
      for (let i = 0; i < 3; i++) {
        await db.collection("staff_services").add({
          staff_id: staff,
          branch_service_id: randomItem(branchServiceIds),
        });
      }
    }

    /** APPOINTMENTS **/
    for (let i = 1; i <= 10; i++) {
      await db.collection("appointments").add({
        client_id: randomItem(userIds),
        branch_id: randomItem(branchIds),
        staff_id: randomItem(staffIds),
        date: `2025-09-${String(i).padStart(2, "0")}`,
        time: "10:00",
        status: "scheduled",
        services: [randomItem(branchServiceIds)],
      });
    }

    console.log("✅ Firebase Auth + Firestore seed complete!");
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  }
}

seed();
