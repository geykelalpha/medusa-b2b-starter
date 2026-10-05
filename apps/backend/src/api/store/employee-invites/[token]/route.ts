import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { StoreEmployeeInvitePreviewResponse } from "../../../../types";
import { hashInviteToken } from "../../../../workflows/employee-invite/utils";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<StoreEmployeeInvitePreviewResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [invite],
  } = await query.graph({
    entity: "employee_invite",
    fields: [
      "email",
      "first_name",
      "last_name",
      "status",
      "expires_at",
      "company.name",
    ],
    filters: { token_hash: hashInviteToken(req.params.token) },
  });

  if (!invite) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "This invite link is invalid"
    );
  }

  const { data: accounts } = await query.graph({
    entity: "customer",
    fields: ["id"],
    filters: { email: invite.email, has_account: true },
  });

  res.json({
    invite: {
      email: invite.email,
      first_name: invite.first_name,
      last_name: invite.last_name,
      status: invite.status,
      expired: new Date(invite.expires_at) <= new Date(),
      has_account: accounts.length > 0,
      company: { name: invite.company?.name ?? "" },
    },
  });
};
