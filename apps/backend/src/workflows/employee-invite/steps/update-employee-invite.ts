import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import {
  ICompanyModuleService,
  ModuleEmployeeInvite,
  ModuleUpdateEmployeeInvite,
} from "../../../types";

export const updateEmployeeInviteStep = createStep(
  "update-employee-invite",
  async (input: ModuleUpdateEmployeeInvite, { container }) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const previous = await companyModuleService.retrieveEmployeeInvite(
      input.id
    );

    const invite = await companyModuleService.updateEmployeeInvites(input);

    return new StepResponse<ModuleEmployeeInvite, ModuleUpdateEmployeeInvite>(
      invite,
      {
        id: previous.id,
        status: previous.status,
        accepted_at: previous.accepted_at,
        employee_id: previous.employee_id,
      }
    );
  },
  async (previous, { container }) => {
    if (!previous) {
      return;
    }

    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    await companyModuleService.updateEmployeeInvites(previous);
  }
);
