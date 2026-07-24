/**
 * Sisoko Renewables — contact form → Resend email Worker (Cloudflare)
 *
 * Receives a JSON POST from the website contact form and sends a
 * notification email via Resend. The RESEND_API_KEY is stored as an
 * encrypted Worker secret — it is NEVER exposed to the browser.
 *
 * Deploy:  see worker/README.md
 */

const ALLOWED_ORIGINS = [
  "https://sisokorenewables.com",
  "https://www.sisokorenewables.com",
  "http://localhost:8080",
];

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST")
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405, headers: { ...headers, "Content-Type": "application/json" } });

    let data;
    try { data = await request.json(); }
    catch { return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } }); }

    // Honeypot: bots fill hidden fields; humans don't.
    if (data.company_url) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });

    const name = (data.name || "").toString().trim();
    const email = (data.email || "").toString().trim();
    if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Name and a valid email are required." }), { status: 422, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const company = (data.company || "").toString().trim();
    const phone = (data.phone || "").toString().trim();
    const service = (data.service || "").toString().trim();
    const message = (data.message || "").toString().trim();

    const TO = env.TO_EMAIL || "stayez.j@gmail.com";
    const FROM = env.FROM_EMAIL || "Sisoko Renewables Website <onboarding@resend.dev>";

    const rows = [
      ["Name", name], ["Company", company || "—"], ["Email", email],
      ["Phone", phone || "—"], ["Primary need", service || "—"],
    ].map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#6b6b66;font:600 13px system-ui">${esc(k)}</td><td style="padding:6px 0;color:#17150f;font:14px system-ui">${esc(v)}</td></tr>`).join("");

    const html = `<div style="max-width:560px;margin:auto;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#17150f">
      <div style="border-left:3px solid #caa24b;padding:2px 0 2px 14px;margin-bottom:20px">
        <div style="letter-spacing:.18em;font-size:11px;color:#95711f;font-weight:700">SISOKO RENEWABLES — NEW LEAD</div>
        <div style="font-size:20px;font-weight:700;margin-top:4px">New consultation request</div>
      </div>
      <table style="border-collapse:collapse;margin-bottom:18px">${rows}</table>
      <div style="color:#6b6b66;font:600 13px system-ui;margin-bottom:4px">Project details</div>
      <div style="white-space:pre-wrap;border:1px solid #eadfc7;background:#faf6ec;border-radius:10px;padding:14px;font:14px system-ui;color:#333">${esc(message || "—")}</div>
      <div style="margin-top:22px;color:#9a988f;font-size:12px">Sent from the sisokorenewables.com contact form.</div>
    </div>`;

    const text = `New consultation request from the Sisoko Renewables website:

Name: ${name}
Company: ${company || "—"}
Email: ${email}
Phone: ${phone || "—"}
Primary need: ${service || "—"}

Project details:
${message || "—"}`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `New lead — ${name}${company ? " (" + company + ")" : ""}`,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return new Response(JSON.stringify({ ok: false, error: "Email service error", detail }), { status: 502, headers: { ...headers, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
  },
};
