import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ModuleEmployeeInvite } from "../../../types";
import {
  updateEmployeeInviteStep,
  validateCompanyAdminStep,
  validateEmployeeInviteStep,
} from "../steps";
import { InviteActor } from "../utils";

type WorkflowInput = {
  invite_id: string;
  company_id: string;
  actor?: InviteActor;
};

export const revokeEmployeeInviteWorkflow = createWorkflow(
  "revoke-employee-invite",
  function (input: WorkflowInput): WorkflowResponse<ModuleEmployeeInvite> {
    validateCompanyAdminStep({
      company_id: input.company_id,
      actor: input.actor,
    });

    validateEmployeeInviteStep({
      invite_id: input.invite_id,
      company_id: input.company_id,
    });

    const invite = updateEmployeeInviteStep({
      id: input.invite_id,
      status: "revoked",
    });

    return new WorkflowResponse(invite);
  }
);
