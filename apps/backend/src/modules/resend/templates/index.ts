import { employeeInviteTemplate } from "./employee-invite";

export type EmailTemplate = {
  subject: (data: Record<string, unknown>) => string;
  html: (data: Record<string, unknown>) => string;
};

export const templates: Record<string, EmailTemplate> = {
  "employee-invite": employeeInviteTemplate,
};
