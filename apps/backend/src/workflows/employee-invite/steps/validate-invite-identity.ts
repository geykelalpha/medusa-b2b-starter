import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ModuleEmployeeInvite } from "../../../types";
import { normalizeEmail } from "../utils";

/**
 * Ensures the authenticated identity accepting the invite owns the invited email,
 * and, for existing customers, that they don't already belong to a company.
 */
export const validateInviteIdentityStep = createStep(
  "validate-invite-identity",
  async (
    input: {
      invite: ModuleEmployeeInvite;
      auth_identity_id: string;
      customer_id?: string;
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const invitedEmail = normalizeEmail(input.invite.email);

    const { data: providerIdentities } = await query.graph({
      entity: "provider_identity",
      fields: ["id", "entity_id", "provider"],
      filters: {
        auth_identity_id: input.auth_identity_id,
        provider: "emailpass",
      } as any,
    });

    const ownsEmail = providerIdentities.some(
      (identity) => normalizeEmail(identity.entity_id) === invitedEmail
    );

    if (!ownsEmail) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This invite was sent to a different email address"
      );
    }

    if (!input.customer_id) {
      return new StepResponse(undefined);
    }

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "employee.id"],
      filters: { id: input.customer_id },
    });

    if (!customer || normalizeEmail(customer.email ?? "") !== invitedEmail) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This invite was sent to a different email address"
      );
    }

    if (customer.employee?.id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Your account already belongs to a company"
      );
    }

    return new StepResponse(undefined);
  }
);
