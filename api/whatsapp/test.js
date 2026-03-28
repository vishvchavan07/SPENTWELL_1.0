// Vercel Serverless Function — /api/whatsapp/test.js
// Sends a test message so you can verify your Meta setup is working

const WHATSAPP_TOKEN  = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    return res.status(500).json({
      error: "Env vars missing. Set WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel dashboard.",
    });
  }

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "phone required" });

  const digits = phone.replace(/\D/g, "");
  const toPhone = digits.startsWith("91") ? `+${digits}` : `+91${digits}`;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to:   toPhone,
          type: "template",
          template: {
            name:     "hello_world", // Meta's default test template
            language: { code: "en_US" },
          },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error?.message, details: result });
    }
    return res.status(200).json({ success: true, message: "Test message sent!", result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
