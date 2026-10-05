import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { AdminEmployeeInviteResponse } from "../../../../../../../types";
import { resendEmployeeInviteWorkflow } from "../../../../../../../workflows/employee-invite/workflows";
import { retrieveInvite } from "../../../../../../utils/employee-invites";

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminEmployeeInviteResponse>
) => {
  const { id, inviteId } = req.params;

  await resendEmployeeInviteWorkflow(req.scope).run({
    input: {
      invite_id: inviteId,
      company_id: id,
      actor: { type: "user", id: req.auth_context.actor_id },
    },
  });

  const invite = await retrieveInvite(req.scope, inviteId);

  res.json({ invite });
};
