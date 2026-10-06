import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/**
 * Ensures the customer can become an employee: it must be a registered
 * customer (guests can't log in) and must not belong to a company yet.
 */
export const validateCustomerCanJoinCompanyStep = createStep(
  "validate-customer-can-join-company",
  async (input: { customer_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "has_account", "employee.id"],
      filters: { id: input.customer_id },
    });

    if (!customer) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Customer with id: ${input.customer_id} was not found`
      );
    }

    if (!customer.has_account) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only registered customers can join a company"
      );
    }

    if (customer.employee?.id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This customer already belongs to a company"
      );
    }

    return new StepResponse(undefined);
  }
);
