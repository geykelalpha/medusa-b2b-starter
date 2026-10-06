import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { transferCompanyOwnershipWorkflow } from "../../../../../workflows/employee/workflows";
import { storeCompanyFields } from "../../query-config";
import { StoreTransferCompanyOwnershipType } from "../../validators";

/**
 * Transfers company ownership to another admin. Only the current owner can
 * do this; the workflow checks it.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreTransferCompanyOwnershipType>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  await transferCompanyOwnershipWorkflow.run({
    input: {
      company_id: id,
      employee_id: req.validatedBody.employee_id,
      requested_by_customer_id: req.auth_context.actor_id,
    },
    container: req.scope,
  });

  const {
    data: [company],
  } = await query.graph(
    {
      entity: "company",
      fields: storeCompanyFields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ company });
};
