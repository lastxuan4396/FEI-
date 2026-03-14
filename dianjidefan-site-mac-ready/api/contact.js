import { ensureConfigured, ensurePost, failure, formatFooter, readBody, rejectSpam, sendEmail, success, validateContact } from "./_shared.js";

export default async function handler(req, res) {
  if (!ensurePost(req, res)) return;
  if (!ensureConfigured(res)) return;

  const body = await readBody(req);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  const company = String(body.company || "").trim();

  if (!rejectSpam(company, res)) return;
  if (!validateContact(name, email, message, res)) return;

  try {
    await sendEmail({
      subject: `垫饥的饭合作咨询 - ${name}`,
      html: `
        <h2>新的合作需求</h2>
        <p><strong>昵称：</strong>${name}</p>
        <p><strong>邮箱：</strong>${email}</p>
        <p><strong>需求描述：</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
        ${formatFooter()}
      `
    });

    success(res, "需求已发送成功，我会尽快回复你。");
  } catch (error) {
    failure(res, error);
  }
}