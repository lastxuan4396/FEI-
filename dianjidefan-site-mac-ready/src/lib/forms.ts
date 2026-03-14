import type { APIRoute } from "astro";
import { formConfig, siteConfig } from "../config/site";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });

const validEmail = (value: string) => /.+@.+\..+/.test(value);

export const requireConfiguredBackend = () => {
  if (!formConfig.resendApiKey || !formConfig.resendFrom || !formConfig.notifyTo) {
    return json(
      {
        message:
          "表单后端还没完成环境变量配置，请先设置 RESEND_API_KEY、FORM_FROM_EMAIL 和 FORM_NOTIFY_TO。"
      },
      503
    );
  }
  return null;
};

export const sendEmail = async ({ subject, html }: { subject: string; html: string }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${formConfig.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: formConfig.resendFrom,
      to: [formConfig.notifyTo],
      subject,
      html
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "邮件发送失败");
  }
};

export const parseBody = async (request: Request) => {
  const body = await request.json().catch(() => ({}));
  return {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim(),
    message: String(body.message || "").trim(),
    company: String(body.company || "").trim()
  };
};

export const rejectSpam = (company: string) => {
  if (company) {
    return json({ message: "提交失败。" }, 400);
  }
  return null;
};

export const validateSubscription = (email: string) => {
  if (!validEmail(email)) {
    return json({ message: "请输入有效邮箱。" }, 400);
  }
  return null;
};

export const validateContact = (name: string, email: string, message: string) => {
  if (!name || !validEmail(email) || !message) {
    return json({ message: "请把信息填写完整。" }, 400);
  }
  return null;
};

export const success = (message: string) => json({ ok: true, message });

export const formatFooter = () => `
  <hr style="margin:24px 0;border:none;border-top:1px solid #ddd" />
  <p style="font-size:12px;color:#666">来源站点：${siteConfig.name}<br />快捷入口：${siteConfig.siteUrl}</p>
`;

export type Handler = APIRoute;
