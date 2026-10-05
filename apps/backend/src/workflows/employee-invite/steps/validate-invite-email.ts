import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService } from "../../../types";

export const validateInviteEmailStep = createStep(
  "validate-invite-email",
  async (input: { company_id: string; email: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "employee.id"],
      filters: { email: input.email, has_account: true },
    });

    if (customers.some((customer) => !!customer.employee?.id)) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `${input.email} already belongs to a company`
      );
    }

    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const pendingInvites = await companyModuleService.listEmployeeInvites({
      company_id: input.company_id,
      email: input.email,
      status: "pending",
    });

    if (pendingInvites.some((invite) => invite.expires_at > new Date())) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `${input.email} already has a pending invite. Resend it instead.`
      );
    }

    return new StepResponse(undefined);
  }
);
