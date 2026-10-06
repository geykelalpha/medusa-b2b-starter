import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService } from "../../../types";

/**
 * Makes the employee the company's owner if the company doesn't have one
 * yet. Used when an employee becomes an admin, so the first admin of a
 * company created by the merchant becomes its owner.
 */
export const claimCompanyOwnershipStep = createStep(
  "claim-company-ownership",
  async (
    input: { employee_id: string; company_id: string },
    { container }
  ) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const owners = await companyModuleService.listEmployees({
      company_id: input.company_id,
      is_owner: true,
    });

    if (owners.length) {
      return new StepResponse(false, null);
    }

    await companyModuleService.updateEmployees({
      id: input.employee_id,
      is_owner: true,
    });

    return new StepResponse(true, input.employee_id);
  },
  async (employeeId: string | null, { container }) => {
    if (!employeeId) {
      return;
    }

    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    await companyModuleService.updateEmployees({
      id: employeeId,
      is_owner: false,
    });
  }
);
