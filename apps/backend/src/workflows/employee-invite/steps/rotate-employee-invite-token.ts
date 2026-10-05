import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService, ModuleEmployeeInvite } from "../../../types";
import { generateInviteToken } from "../utils";

/**
 * Issues a new token and expiry for an invite, invalidating the previous link.
 */
export const rotateEmployeeInviteTokenStep = createStep(
  "rotate-employee-invite-token",
  async (input: { invite_id: string }, { container }) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const previous = await companyModuleService.retrieveEmployeeInvite(
      input.invite_id
    );

    const { token, token_hash, expires_at } = generateInviteToken();

    const invite = await companyModuleService.updateEmployeeInvites({
      id: input.invite_id,
      token_hash,
      expires_at,
    });

    return new StepResponse<
      { invite: ModuleEmployeeInvite; token: string },
      Pick<ModuleEmployeeInvite, "id" | "token_hash" | "expires_at">
    >(
      { invite, token },
      {
        id: previous.id,
        token_hash: previous.token_hash,
        expires_at: previous.expires_at,
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
