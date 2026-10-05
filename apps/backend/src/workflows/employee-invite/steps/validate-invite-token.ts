import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import { ICompanyModuleService } from "../../../types";
import { hashInviteToken } from "../utils";

/**
 * Resolves an invite from its raw token, ensuring it's still pending and not expired.
 */
export const validateInviteTokenStep = createStep(
  "validate-invite-token",
  async (input: { token: string }, { container }) => {
    const companyModuleService =
      container.resolve<ICompanyModuleService>(COMPANY_MODULE);

    const [invite] = await companyModuleService.listEmployeeInvites({
      token_hash: hashInviteToken(input.token),
    });

    if (!invite) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "This invite link is invalid"
      );
    }

    if (invite.status !== "pending") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `This invite has already been ${invite.status}`
      );
    }

    if (new Date(invite.expires_at) <= new Date()) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This invite has expired"
      );
    }

    return new StepResponse(invite);
  }
);
