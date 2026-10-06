import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService } from "../../../types";

/**
 * Ensures every employee belongs to the company and none of them is its
 * owner. The owner has to transfer ownership before they can be removed.
 */
export const validateEmployeesRemovableStep = createStep(
  "validate-employees-removable",
  async (
    input: { company_id: string; employee_ids: string[] },
    { container }
  ) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const employees = await companyModuleService.listEmployees({
      id: input.employee_ids,
      company_id: input.company_id,
    });

    const missing = input.employee_ids.filter(
      (id) => !employees.some((employee) => employee.id === id)
    );

    if (missing.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Employees with ids: ${missing.join(", ")} were not found`
      );
    }

    if (employees.some((employee) => employee.is_owner)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The company owner can't be removed. Transfer ownership first."
      );
    }

    return new StepResponse(undefined);
  }
);
