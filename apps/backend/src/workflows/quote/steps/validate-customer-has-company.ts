import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/**
 * Quotes are a company feature, so only customers that belong to a company
 * can request them.
 */
export const validateCustomerHasCompanyStep = createStep(
  "validate-customer-has-company",
  async (input: { customer_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "employee.id"],
      filters: { id: input.customer_id },
    });

    if (!customer?.employee?.id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only customers that belong to a company can request quotes"
      );
    }

    return new StepResponse(undefined);
  }
);
