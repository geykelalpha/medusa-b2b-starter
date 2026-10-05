import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { EMPLOYEE_INVITE_SENT_EVENT } from "../workflows/employee-invite/utils";

export default async function employeeInviteSentHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; token: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  const {
    data: [invite],
  } = await query.graph({
    entity: "employee_invite",
    fields: ["id", "email", "first_name", "expires_at", "company.name"],
    filters: { id: data.id },
  });

  if (!invite) {
    return;
  }

  const storefrontUrl = (
    process.env.STOREFRONT_URL || "http://localhost:8000"
  ).replace(/\/$/, "");

  await notificationModuleService.createNotifications({
    to: invite.email,
    channel: "email",
    template: "employee-invite",
    data: {
      company_name: invite.company?.name,
      first_name: invite.first_name,
      expires_at: invite.expires_at,
      invite_url: `${storefrontUrl}/invite?token=${encodeURIComponent(
        data.token
      )}`,
    },
  });
}

export const config: SubscriberConfig = {
  event: EMPLOYEE_INVITE_SENT_EVENT,
};
