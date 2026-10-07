import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";
import { ModuleEmployeeInvite } from "../../../types";
import { validateEmployeeParentStep } from "../../employee/steps";
import {
  createEmployeeInviteStep,
  validateCompanyAdminStep,
  validateInviteEmailStep,
} from "../steps";
import { EMPLOYEE_INVITE_SENT_EVENT, InviteActor, normalizeEmail } from "../utils";

type WorkflowInput = {
  company_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  spending_limit?: number;
  is_admin?: boolean;
  parent_employee_id?: string | null;
  actor?: InviteActor;
};

export const createEmployeeInviteWorkflow = createWorkflow(
  "create-employee-invite",
  function (input: WorkflowInput): WorkflowResponse<ModuleEmployeeInvite> {
    validateCompanyAdminStep({
      company_id: input.company_id,
      actor: input.actor,
    });

    validateEmployeeParentStep({
      company_id: input.company_id,
      parent_employee_id: input.parent_employee_id,
    });

    const inviteData = transform({ input }, ({ input }) => {
      const { actor, ...data } = input;
      return {
        ...data,
        email: normalizeEmail(data.email),
        invited_by: actor?.id ?? null,
      };
    });

    validateInviteEmailStep({
      company_id: inviteData.company_id,
      email: inviteData.email,
    });

    const { invite, token } = createEmployeeInviteStep(inviteData);

    emitEventStep({
      eventName: EMPLOYEE_INVITE_SENT_EVENT,
      data: { id: invite.id, token },
    });

    return new WorkflowResponse(invite);
  }
);
