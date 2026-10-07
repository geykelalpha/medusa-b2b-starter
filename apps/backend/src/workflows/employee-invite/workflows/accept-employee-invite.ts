import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows";
import { ModuleEmployee } from "../../../types";
import { createEmployeesWorkflow } from "../../employee/workflows";
import {
  updateEmployeeInviteStep,
  validateInviteIdentityStep,
  validateInviteTokenStep,
} from "../steps";

type WorkflowInput = {
  token: string;
  auth_identity_id: string;
  /**
   * The registered customer accepting the invite. When omitted, a new
   * customer account is created for the auth identity.
   */
  customer_id?: string;
  customer_data?: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  };
};

export const acceptEmployeeInviteWorkflow = createWorkflow(
  "accept-employee-invite",
  function (input: WorkflowInput): WorkflowResponse<ModuleEmployee> {
    const invite = validateInviteTokenStep({ token: input.token });

    validateInviteIdentityStep({
      invite,
      auth_identity_id: input.auth_identity_id,
      customer_id: input.customer_id,
    });

    const createdCustomer = when(
      "create-invited-customer-account",
      { input },
      ({ input }) => !input.customer_id
    ).then(() => {
      const customerData = transform(
        { input, invite },
        ({ input, invite }) => ({
          email: invite.email,
          first_name: input.customer_data?.first_name ?? invite.first_name,
          last_name: input.customer_data?.last_name ?? invite.last_name,
          phone: input.customer_data?.phone ?? invite.phone,
        })
      );

      return createCustomerAccountWorkflow.runAsStep({
        input: {
          authIdentityId: input.auth_identity_id,
          customerData,
        },
      });
    });

    const employeeInput = transform(
      { input, invite, createdCustomer },
      ({ input, invite, createdCustomer }) => {
        const customerId = (input.customer_id ?? createdCustomer?.id)!;

        return {
          employeeData: {
            company_id: invite.company_id,
            customer_id: customerId,
            spending_limit: invite.spending_limit,
            is_admin: invite.is_admin,
            parent_employee_id: invite.parent_employee_id,
          },
          customerId,
        };
      }
    );

    const employee = createEmployeesWorkflow.runAsStep({
      input: employeeInput,
    });

    const inviteUpdate = transform(
      { invite, employee },
      ({ invite, employee }) => ({
        id: invite.id,
        status: "accepted" as const,
        accepted_at: new Date(),
        employee_id: employee.id,
      })
    );

    updateEmployeeInviteStep(inviteUpdate);

    return new WorkflowResponse(employee);
  }
);
