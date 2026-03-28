// functions/index.js
// Firebase Cloud Functions — Scheduled WhatsApp reminders
//
// Deploy with: firebase deploy --only functions
// Requires: firebase-admin, firebase-functions, node-fetch

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp }  = require("firebase-admin/app");
const { getFirestore }   = require("firebase-admin/firestore");

initializeApp();

const WHATSAPP_TOKEN  = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_URL         = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Helper: call Meta Cloud API ─────────────────────────────
async function sendWhatsApp(to, templateName, components = []) {
  const digits = to.replace(/\D/g, "");
  const phone  = digits.startsWith("91") ? `+${digits}` : `+91${digits}`;

  const res = await fetch(API_URL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: { name: templateName, language: { code: "en" }, components },
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "WhatsApp API error");
  return json;
}

// ── DAILY REMINDER — Every day at 9 PM IST (3:30 PM UTC) ───
// Cron: "30 15 * * *"
exports.scheduledDailyReminder = onSchedule("30 15 * * *", async () => {
  const db        = getFirestore();
  const usersSnap = await db.collection("users").get();

  const promises = [];
  for (const userDoc of usersSnap.docs) {
    const profileSnap = await userDoc.ref.collection("profile").doc("data").get();
    if (!profileSnap.exists) continue;
    const profile = profileSnap.data();

    // Check opt-in
    if (!profile.whatsappEnabled || !profile.phone) continue;

    promises.push(
      sendWhatsApp(profile.phone, "spentwell_daily_reminder")
        .then(() => console.log(`Daily reminder sent to ${profile.phone}`))
        .catch(err => console.error(`Failed for ${profile.phone}:`, err.message))
    );
  }

  await Promise.allSettled(promises);
  console.log(`Daily reminders: processed ${promises.length} users`);
});

// ── MONTHLY SUMMARY — 1st of every month at 8 AM IST ────────
// Cron: "30 2 1 * *"
exports.scheduledMonthlyReport = onSchedule("30 2 1 * *", async () => {
  const db        = getFirestore();
  const usersSnap = await db.collection("users").get();
  const now       = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthName = MONTHS[lastMonth.getMonth()];

  const promises = [];
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;

    const [profileSnap, dataSnap] = await Promise.all([
      userDoc.ref.collection("profile").doc("data").get(),
      userDoc.ref.collection("appData").doc("main").get(),
    ]);

    if (!profileSnap.exists || !dataSnap.exists) continue;
    const profile = profileSnap.data();
    const appData = dataSnap.data();

    if (!profile.whatsappEnabled || !profile.phone) continue;

    // Calculate last month's stats
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
    const expenses = (appData.expenses || []).filter(e => e.date?.startsWith(lastMonthStr));
    const total    = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const budget   = parseInt(profile.monthlyBudget || 5000);
    const saved    = Math.max(0, budget - total);

    // Find top category
    const catTotals = {};
    expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    promises.push(
      sendWhatsApp(profile.phone, "spentwell_monthly_report", [
        {
          type: "body",
          parameters: [
            { type: "text", text: String(total) },
            { type: "text", text: monthName },
            { type: "text", text: topCategory },
            { type: "text", text: String(saved) },
          ],
        },
      ])
        .then(() => console.log(`Monthly report sent to uid=${uid}`))
        .catch(err => console.error(`Monthly report failed for uid=${uid}:`, err.message))
    );
  }

  await Promise.allSettled(promises);
  console.log(`Monthly reports: processed ${promises.length} users`);
});
