import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService } from "../../../types";

type ValidateEmployeeParentInput = {
  company_id: string;
  /** The employee being placed. Omitted when it doesn't exist yet. */
  employee_id?: string;
  parent_employee_id?: string | null;
};

/**
 * Ensures a parent in the employee tree belongs to the same company and,
 * when moving an existing employee, that the move doesn't create a cycle
 * (an employee can't sit under itself or one of its descendants).
 */
export const validateEmployeeParentStep = createStep(
  "validate-employee-parent",
  async (input: ValidateEmployeeParentInput, { container }) => {
    const parentId = input.parent_employee_id;

    if (!parentId) {
      return new StepResponse(undefined);
    }

    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const [parent] = await companyModuleService.listEmployees(
      { id: parentId },
      { select: ["id", "company_id"] }
    );

    if (!parent) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Employee with id: ${parentId} was not found`
      );
    }

    if (parent.company_id !== input.company_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "An employee can only be placed under an employee of the same company"
      );
    }

    if (!input.employee_id) {
      return new StepResponse(undefined);
    }

    if (parentId === input.employee_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "An employee can't be placed under itself"
      );
    }

    const employees = await companyModuleService.listEmployees(
      { company_id: input.company_id },
      { select: ["id", "parent_employee_id"] }
    );

    const parentOf = new Map(
      employees.map((employee) => [employee.id, employee.parent_employee_id])
    );

    // Walk up from the new parent. Reaching the employee means the parent
    // is one of its descendants.
    const seen = new Set<string>();
    let current: string | null | undefined = parentId;

    while (current && !seen.has(current)) {
      if (current === input.employee_id) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "An employee can't be placed under one of its own descendants"
        );
      }

      seen.add(current);
      current = parentOf.get(current);
    }

    return new StepResponse(undefined);
  }
);
