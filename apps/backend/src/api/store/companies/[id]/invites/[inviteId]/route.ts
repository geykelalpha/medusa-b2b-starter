import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { StoreEmployeeInviteResponse } from "../../../../../../types";
import { revokeEmployeeInviteWorkflow } from "../../../../../../workflows/employee-invite/workflows";
import { retrieveInvite } from "../../../../../utils/employee-invites";

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreEmployeeInviteResponse>
) => {
  const { id, inviteId } = req.params;

  await revokeEmployeeInviteWorkflow(req.scope).run({
    input: {
      invite_id: inviteId,
      company_id: id,
      actor: { type: "customer", id: req.auth_context.actor_id },
    },
  });

  const invite = await retrieveInvite(req.scope, inviteId);

  res.json({ invite });
};
