import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import {
  ICompanyModuleService,
  ModuleCreateEmployeeInvite,
  ModuleEmployeeInvite,
} from "../../../types";
import { generateInviteToken } from "../utils";

export type CreateEmployeeInviteStepInput = Omit<
  ModuleCreateEmployeeInvite,
  "token_hash" | "expires_at"
>;

export const createEmployeeInviteStep = createStep(
  "create-employee-invite",
  async (input: CreateEmployeeInviteStepInput, { container }) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const { token, token_hash, expires_at } = generateInviteToken();

    const invite = await companyModuleService.createEmployeeInvites({
      ...input,
      token_hash,
      expires_at,
    });

    return new StepResponse<
      { invite: ModuleEmployeeInvite; token: string },
      string
    >({ invite, token }, invite.id);
  },
  async (inviteId: string, { container }) => {
    if (!inviteId) {
      return;
    }

    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    await companyModuleService.deleteEmployeeInvites([inviteId]);
  }
);
