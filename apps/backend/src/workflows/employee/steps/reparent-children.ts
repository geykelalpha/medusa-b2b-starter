import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService } from "../../../types";

type ParentChange = { id: string; parent_employee_id: string | null };

type ReparentCompensation = {
  employees: ParentChange[];
  invites: ParentChange[];
};

/**
 * Before employees are removed, moves their children and their pending
 * invites up to the nearest remaining ancestor (or the top level), so the
 * tree never points at a removed employee.
 */
export const reparentChildrenStep = createStep(
  "reparent-children",
  async (
    input: { company_id: string; employee_ids: string[] },
    { container }
  ) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const removed = new Set(input.employee_ids);

    const employees = await companyModuleService.listEmployees(
      { company_id: input.company_id },
      { select: ["id", "parent_employee_id"] }
    );

    const parentOf = new Map(
      employees.map((employee) => [employee.id, employee.parent_employee_id])
    );

    // The nearest ancestor that isn't being removed
    const resolveParent = (id: string | null): string | null => {
      const seen = new Set<string>();

      while (id && removed.has(id) && !seen.has(id)) {
        seen.add(id);
        id = parentOf.get(id) ?? null;
      }

      return id && removed.has(id) ? null : id;
    };

    const employeeChanges = employees
      .filter(
        (employee) =>
          !removed.has(employee.id) &&
          !!employee.parent_employee_id &&
          removed.has(employee.parent_employee_id)
      )
      .map((employee) => ({
        id: employee.id,
        previous: employee.parent_employee_id,
        next: resolveParent(employee.parent_employee_id),
      }));

    const invites = await companyModuleService.listEmployeeInvites(
      {
        company_id: input.company_id,
        status: "pending",
        parent_employee_id: input.employee_ids,
      },
      { select: ["id", "parent_employee_id"] }
    );

    const inviteChanges = invites.map((invite) => ({
      id: invite.id,
      previous: invite.parent_employee_id,
      next: resolveParent(invite.parent_employee_id),
    }));

    for (const change of employeeChanges) {
      await companyModuleService.updateEmployees({
        id: change.id,
        parent_employee_id: change.next,
      });
    }

    for (const change of inviteChanges) {
      await companyModuleService.updateEmployeeInvites({
        id: change.id,
        parent_employee_id: change.next,
      });
    }

    return new StepResponse<undefined, ReparentCompensation>(undefined, {
      employees: employeeChanges.map(({ id, previous }) => ({
        id,
        parent_employee_id: previous,
      })),
      invites: inviteChanges.map(({ id, previous }) => ({
        id,
        parent_employee_id: previous,
      })),
    });
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return;
    }

    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    for (const change of compensation.employees) {
      await companyModuleService.updateEmployees(change);
    }

    for (const change of compensation.invites) {
      await companyModuleService.updateEmployeeInvites(change);
    }
  }
);
