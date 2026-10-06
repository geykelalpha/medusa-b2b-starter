import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/**
 * Protects the company owner: the owner must stay an admin, and on the
 * storefront only the owner can edit their own employee record.
 */
export const validateEmployeeUpdateStep = createStep(
  "validate-employee-update",
  async (
    input: {
      id: string;
      company_id: string;
      is_admin?: boolean;
      /** The storefront customer making the change. Omitted for the merchant. */
      requested_by_customer_id?: string;
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [employee],
    } = await query.graph({
      entity: "employee",
      fields: ["id", "is_owner", "customer.id"],
      filters: { id: input.id, company_id: input.company_id },
    });

    if (!employee) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Employee with id: ${input.id} was not found`
      );
    }

    if (!employee.is_owner) {
      return new StepResponse(undefined);
    }

    if (input.is_admin === false) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The company owner must remain an admin. Transfer ownership first."
      );
    }

    if (
      input.requested_by_customer_id &&
      employee.customer?.id !== input.requested_by_customer_id
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only the owner can edit the company owner"
      );
    }

    return new StepResponse(undefined);
  }
);
