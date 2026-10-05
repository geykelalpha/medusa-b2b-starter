import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { QueryEmployeeInvite } from "../../types";

// token_hash is intentionally never exposed
export const employeeInviteFields = [
  "id",
  "email",
  "first_name",
  "last_name",
  "phone",
  "spending_limit",
  "is_admin",
  "status",
  "expires_at",
  "accepted_at",
  "invited_by",
  "employee_id",
  "company_id",
  "created_at",
  "updated_at",
];

export const retrieveInvite = async (scope: MedusaContainer, id: string) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [invite],
  } = await query.graph(
    {
      entity: "employee_invite",
      fields: employeeInviteFields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  return invite as unknown as QueryEmployeeInvite;
};
