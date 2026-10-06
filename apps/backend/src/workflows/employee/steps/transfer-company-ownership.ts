import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService } from "../../../types";

type TransferInput = {
  from_employee_id: string | null;
  to_employee_id: string;
};

const setOwner = async (
  companyModuleService: ICompanyModuleService,
  { from_employee_id, to_employee_id }: TransferInput
) => {
  // Unset the current owner first: only one owner per company is allowed
  if (from_employee_id) {
    await companyModuleService.updateEmployees({
      id: from_employee_id,
      is_owner: false,
    });
  }

  await companyModuleService.updateEmployees({
    id: to_employee_id,
    is_owner: true,
  });
};

export const transferCompanyOwnershipStep = createStep(
  "transfer-company-ownership",
  async (input: TransferInput, { container }) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    await setOwner(companyModuleService, input);

    return new StepResponse(input, input);
  },
  async (input: TransferInput, { container }) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    await companyModuleService.updateEmployees({
      id: input.to_employee_id,
      is_owner: false,
    });

    if (input.from_employee_id) {
      await companyModuleService.updateEmployees({
        id: input.from_employee_id,
        is_owner: true,
      });
    }
  }
);
