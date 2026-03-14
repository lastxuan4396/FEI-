const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const validEmail = (value) => /.+@.+\..+/.test(String(value || ""));

export const readBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const ensurePost = (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { message: "Method Not Allowed" });
    return false;
  }
  return true;
};

export const ensureConfigured = (res) => {
  if (!process.env.RESEND_API_KEY || !process.env.FORM_FROM_EMAIL || !process.env.FORM_NOTIFY_TO) {
    json(res, 503, {
      message: "表单后端还没完成环境变量配置，请先设置 RESEND_API_KEY、FORM_FROM_EMAIL 和 FORM_NOTIFY_TO。"
    });
    return false;
  }
  return true;
};

export const rejectSpam = (company, res) => {
  if (company) {
    json(res, 400, { message: "提交失败。" });
    return false;
  }
  return true;
};

export const validateSubscription = (email, res) => {
  if (!validEmail(email)) {
    json(res, 400, { message: "请输入有效邮箱。" });
    return false;
  }
  return true;
};

export const validateContact = (name, email, message, res) => {
  if (!name || !validEmail(email) || !message) {
    json(res, 400, { message: "请把信息填写完整。" });
    return false;
  }
  return true;
};

export const sendEmail = async ({ subject, html }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.FORM_FROM_EMAIL,
      to: [process.env.FORM_NOTIFY_TO],
      subject,
      html
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "邮件发送失败");
  }
};

export const success = (res, message) => json(res, 200, { ok: true, message });
export const failure = (res, error) => json(res, 500, { message: error instanceof Error ? error.message : "提交失败，请稍后再试。" });

export const formatFooter = () => `
  <hr style="margin:24px 0;border:none;border-top:1px solid #ddd" />
  <p style="font-size:12px;color:#666">来源站点：垫饥的饭<br />快捷入口：https://is.gd/dianjidefanplus2</p>
`;