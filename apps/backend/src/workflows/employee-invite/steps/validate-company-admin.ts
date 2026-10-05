import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { InviteActor } from "../utils";

/**
 * Ensures a storefront customer is an admin of the company they're managing
 * invites for. Admin users are always allowed.
 */
export const validateCompanyAdminStep = createStep(
  "validate-company-admin",
  async (
    input: { company_id: string; actor?: InviteActor },
    { container }
  ) => {
    if (input.actor?.type !== "customer") {
      return new StepResponse(undefined);
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "employee.id", "employee.is_admin", "employee.company_id"],
      filters: { id: input.actor.id },
    });

    const employee = customer?.employee;

    if (!employee?.is_admin || employee.company_id !== input.company_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only company admins can manage employee invites"
      );
    }

    return new StepResponse(undefined);
  }
);
