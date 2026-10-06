import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { transferCompanyOwnershipWorkflow } from "../../../../../workflows/employee/workflows";
import { adminCompanyFields } from "../../query-config";
import { AdminTransferCompanyOwnershipType } from "../../validators";

/**
 * Lets the merchant make any admin of the company its owner.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminTransferCompanyOwnershipType>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  await transferCompanyOwnershipWorkflow.run({
    input: {
      company_id: id,
      employee_id: req.validatedBody.employee_id,
    },
    container: req.scope,
  });

  const {
    data: [company],
  } = await query.graph(
    {
      entity: "company",
      fields: adminCompanyFields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ company });
};
