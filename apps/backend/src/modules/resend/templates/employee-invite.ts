import type { EmailTemplate } from ".";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const employeeInviteTemplate: EmailTemplate = {
  subject: (data) => `You've been invited to join ${data.company_name}`,
  html: (data) => {
    const companyName = escapeHtml(data.company_name);
    const firstName = escapeHtml(data.first_name);
    const inviteUrl = escapeHtml(data.invite_url);
    const expiresAt = data.expires_at
      ? new Date(data.expires_at as string).toUTCString()
      : null;

    return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;padding:32px;">
            <tr>
              <td>
                <h1 style="font-size:20px;margin:0 0 16px;">Join ${companyName}</h1>
                <p style="font-size:14px;line-height:20px;margin:0 0 16px;">
                  Hi${firstName ? ` ${firstName}` : ""},
                </p>
                <p style="font-size:14px;line-height:20px;margin:0 0 24px;">
                  You've been invited to join <strong>${companyName}</strong>. Accept the invite to set up your account and start ordering on behalf of your company.
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${inviteUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;">Accept invite</a>
                </p>
                <p style="font-size:12px;line-height:18px;color:#71717a;margin:0;">
                  ${expiresAt ? `This invite expires on ${escapeHtml(expiresAt)}. ` : ""}If the button doesn't work, copy this link into your browser:<br />
                  <a href="${inviteUrl}" style="color:#71717a;word-break:break-all;">${inviteUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  },
};
