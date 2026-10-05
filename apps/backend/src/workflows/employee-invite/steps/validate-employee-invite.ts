import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService } from "../../../types";

/**
 * Ensures the invite belongs to the company and is still pending.
 */
export const validateEmployeeInviteStep = createStep(
  "validate-employee-invite",
  async (input: { invite_id: string; company_id: string }, { container }) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const [invite] = await companyModuleService.listEmployeeInvites({
      id: input.invite_id,
      company_id: input.company_id,
    });

    if (!invite) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Employee invite with id ${input.invite_id} was not found`
      );
    }

    if (invite.status !== "pending") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Employee invite is already ${invite.status}`
      );
    }

    return new StepResponse(invite);
  }
);
