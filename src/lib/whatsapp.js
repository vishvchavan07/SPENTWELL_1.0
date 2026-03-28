/**
 * src/lib/whatsapp.js
 * Client-side helper to call the Vercel /api/whatsapp/send endpoint.
 * All heavy lifting (token, API call) happens server-side — never expose token to browser.
 */

const API_BASE = "/api/whatsapp/send";

/**
 * Core send function — calls the Vercel serverless function
 */
async function sendAlert(phone, type, data = {}) {
  try {
    const res = await fetch(API_BASE, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone, type, data }),
    });
    const json = await res.json();
    if (!res.ok) {
      console.warn(`WhatsApp alert failed (${type}):`, json.error);
      return { success: false, error: json.error };
    }
    return { success: true, messageId: json.messageId };
  } catch (err) {
    console.warn("WhatsApp network error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * A) Expense Added Alert
 * Template: spentwell_expense_added
 * "SpentWell ✅ ₹{amount} spent on {category}. Budget left: ₹{remaining}"
 */
export function alertExpenseAdded({ phone, amount, category, remaining }) {
  return sendAlert(phone, "expense_added", { amount, category, remaining });
}

/**
 * B) Budget Limit Alert — fires at 80% threshold
 * Template: spentwell_budget_alert
 * "⚠️ SpentWell Alert: {category} budget 80% used! ₹{spent} of ₹{limit} spent."
 */
export function alertBudgetLimit({ phone, category, spent, limit }) {
  return sendAlert(phone, "budget_alert", { category, spent, limit });
}

/**
 * C) Daily Reminder (called from Firebase Cloud Function)
 * Template: spentwell_daily_reminder
 */
export function alertDailyReminder({ phone }) {
  return sendAlert(phone, "daily_reminder");
}

/**
 * D) Monthly Summary (called from Firebase Cloud Function)
 * Template: spentwell_monthly_report
 */
export function alertMonthlySummary({ phone, total, month, topCategory, saved }) {
  return sendAlert(phone, "monthly_summary", { total, month, topCategory, saved });
}
