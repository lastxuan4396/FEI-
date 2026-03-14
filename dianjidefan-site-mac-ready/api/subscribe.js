import { ensureConfigured, ensurePost, failure, formatFooter, readBody, rejectSpam, sendEmail, success, validateSubscription } from "./_shared.js";

export default async function handler(req, res) {
  if (!ensurePost(req, res)) return;
  if (!ensureConfigured(res)) return;

  const body = await readBody(req);
  const email = String(body.email || "").trim();
  const company = String(body.company || "").trim();

  if (!rejectSpam(company, res)) return;
  if (!validateSubscription(email, res)) return;

  try {
    await sendEmail({
      subject: "垫饥的饭订阅申请",
      html: `
        <h2>新的订阅申请</h2>
        <p><strong>邮箱：</strong>${email}</p>
        ${formatFooter()}
      `
    });

    success(res, "订阅成功，我会把更新直接发到你的邮箱。");
  } catch (error) {
    failure(res, error);
  }
}