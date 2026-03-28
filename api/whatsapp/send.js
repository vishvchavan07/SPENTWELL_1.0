// Vercel Serverless Function — /api/whatsapp/send.js
// Called by the client to send WhatsApp messages via Meta Cloud API

const WHATSAPP_TOKEN   = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID  = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_URL          = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

/**
 * Validate Indian phone number and normalize to +91XXXXXXXXXX
 */
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return null;
}

/**
 * Build WhatsApp template message payload
 */
function buildPayload(to, templateName, components = []) {
  return {
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to,
    type:     "template",
    template: {
      name:       templateName,
      language:   { code: "en" },
      components,
    },
  };
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    return res.status(500).json({ error: "WhatsApp API not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to env." });
  }

  try {
    const { phone, type, data } = req.body;

    if (!phone || !type) {
      return res.status(400).json({ error: "phone and type are required" });
    }

    const toPhone = normalizePhone(phone);
    if (!toPhone) {
      return res.status(400).json({ error: "Invalid phone number. Use 10-digit Indian number." });
    }

    let payload;

    switch (type) {
      // ── A) Expense Added ────────────────────────────────────
      case "expense_added":
        payload = buildPayload(toPhone, "spentwell_expense_added", [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(data.amount) },
              { type: "text", text: data.category },
              { type: "text", text: String(data.remaining) },
            ],
          },
        ]);
        break;

      // ── B) Budget Alert (80% used) ──────────────────────────
      case "budget_alert":
        payload = buildPayload(toPhone, "spentwell_budget_alert", [
          {
            type: "body",
            parameters: [
              { type: "text", text: data.category },
              { type: "text", text: String(data.spent) },
              { type: "text", text: String(data.limit) },
            ],
          },
        ]);
        break;

      // ── C) Daily Reminder ───────────────────────────────────
      case "daily_reminder":
        payload = buildPayload(toPhone, "spentwell_daily_reminder", []);
        break;

      // ── D) Monthly Summary ──────────────────────────────────
      case "monthly_summary":
        payload = buildPayload(toPhone, "spentwell_monthly_report", [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(data.total) },
              { type: "text", text: data.month },
              { type: "text", text: data.topCategory },
              { type: "text", text: String(data.saved) },
            ],
          },
        ]);
        break;

      default:
        return res.status(400).json({ error: `Unknown type: ${type}` });
    }

    // ── Call Meta Cloud API ──────────────────────────────────
    const response = await fetch(API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", result);
      return res.status(response.status).json({
        error:   result.error?.message || "WhatsApp API error",
        details: result,
      });
    }

    return res.status(200).json({ success: true, messageId: result.messages?.[0]?.id });

  } catch (err) {
    console.error("WhatsApp send error:", err);
    return res.status(500).json({ error: err.message });
  }
}
