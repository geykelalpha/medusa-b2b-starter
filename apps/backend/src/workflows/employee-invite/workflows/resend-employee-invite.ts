import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";
import { ModuleEmployeeInvite } from "../../../types";
import {
  rotateEmployeeInviteTokenStep,
  validateCompanyAdminStep,
  validateEmployeeInviteStep,
} from "../steps";
import { EMPLOYEE_INVITE_SENT_EVENT, InviteActor } from "../utils";

type WorkflowInput = {
  invite_id: string;
  company_id: string;
  actor?: InviteActor;
};

export const resendEmployeeInviteWorkflow = createWorkflow(
  "resend-employee-invite",
  function (input: WorkflowInput): WorkflowResponse<ModuleEmployeeInvite> {
    validateCompanyAdminStep({
      company_id: input.company_id,
      actor: input.actor,
    });

    validateEmployeeInviteStep({
      invite_id: input.invite_id,
      company_id: input.company_id,
    });

    const { invite, token } = rotateEmployeeInviteTokenStep({
      invite_id: input.invite_id,
    });

    emitEventStep({
      eventName: EMPLOYEE_INVITE_SENT_EVENT,
      data: { id: invite.id, token },
    });

    return new WorkflowResponse(invite);
  }
);
