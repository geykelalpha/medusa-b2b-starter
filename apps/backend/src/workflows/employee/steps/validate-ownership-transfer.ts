import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

export type ValidateOwnershipTransferInput = {
  company_id: string;
  /** The employee that becomes the owner. */
  employee_id: string;
  /** The storefront customer making the change. Omitted for the merchant. */
  requested_by_customer_id?: string;
};

/**
 * Validates an ownership transfer and returns the current and new owner. The
 * new owner must be an admin of the same company. On the storefront, only
 * the current owner can transfer ownership.
 */
export const validateOwnershipTransferStep = createStep(
  "validate-ownership-transfer",
  async (input: ValidateOwnershipTransferInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: employees } = await query.graph({
      entity: "employee",
      fields: ["id", "is_admin", "is_owner", "customer.id"],
      filters: { company_id: input.company_id },
    });

    const currentOwner = employees.find((employee) => employee.is_owner);
    const newOwner = employees.find(
      (employee) => employee.id === input.employee_id
    );

    if (
      input.requested_by_customer_id &&
      currentOwner?.customer?.id !== input.requested_by_customer_id
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only the company owner can transfer ownership"
      );
    }

    if (!newOwner) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Employee with id: ${input.employee_id} was not found`
      );
    }

    if (newOwner.is_owner) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This employee is already the company owner"
      );
    }

    if (!newOwner.is_admin) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Ownership can only be transferred to an admin"
      );
    }

    return new StepResponse({
      from_employee_id: (currentOwner?.id as string | undefined) ?? null,
      to_employee_id: newOwner.id as string,
    });
  }
);
