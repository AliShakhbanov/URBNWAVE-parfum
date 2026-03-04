const TELEGRAM_API = "https://api.telegram.org";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendTelegramLead({ email, source, page }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { sent: false, reason: "missing_telegram_env" };
  }

  const text = [
    "Новая подписка URBNWAVE",
    `Email: ${email}`,
    `Источник: ${source || "unknown"}`,
    `Страница: ${page || "/"}`,
    `Время: ${new Date().toISOString()}`,
  ].join("\n");

  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`telegram_send_failed: ${details || response.status}`);
  }

  return { sent: true };
}

async function sendEmailLead({ email, source, page }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_EMAIL_TO || "alihka0529@gmail.com";
  const from = process.env.LEADS_EMAIL_FROM || "URBNWAVE <onboarding@resend.dev>";

  if (!apiKey) {
    return { sent: false, reason: "missing_resend_env" };
  }

  const html = [
    "<h2>Новая подписка URBNWAVE</h2>",
    `<p><b>Email:</b> ${email}</p>`,
    `<p><b>Источник:</b> ${source || "unknown"}</p>`,
    `<p><b>Страница:</b> ${page || "/"}</p>`,
    `<p><b>Время:</b> ${new Date().toISOString()}</p>`,
  ].join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "URBNWAVE: новая подписка",
      html,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`email_send_failed: ${details || response.status}`);
  }

  return { sent: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const email = normalizeEmail(body.email);
    const source = String(body.source || "footer").slice(0, 120);
    const page = String(body.page || "/").slice(0, 200);

    if (!isValidEmail(email)) {
      return json(res, 400, { error: "Введите корректный email" });
    }

    const channels = [];
    const errors = [];

    try {
      const telegram = await sendTelegramLead({ email, source, page });
      if (telegram.sent) channels.push("telegram");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "telegram_error");
    }

    try {
      const emailResult = await sendEmailLead({ email, source, page });
      if (emailResult.sent) channels.push("email");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "email_error");
    }

    if (channels.length === 0) {
      const hasConfiguredChannel = Boolean(
        (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) || process.env.RESEND_API_KEY,
      );

      return json(res, hasConfiguredChannel ? 502 : 500, {
        error: hasConfiguredChannel
          ? "Не удалось отправить уведомление. Проверьте настройки каналов."
          : "Каналы уведомлений не настроены (Telegram bot или Resend).",
        details: errors,
      });
    }

    return json(res, 200, { ok: true, channels });
  } catch (error) {
    return json(res, 500, {
      error: "Server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
