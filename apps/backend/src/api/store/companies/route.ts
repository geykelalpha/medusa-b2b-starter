import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createCompanyForCustomerWorkflow } from "../../../workflows/company/workflows/create-company-for-customer";
import { ModuleCreateCompany } from "../../../types";
import { StoreCreateCompanyType } from "./validators";

/**
 * Creates a company for the logged-in customer and makes them its admin.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateCompanyType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    result: { company: createdCompany },
  } = await createCompanyForCustomerWorkflow.run({
    input: {
      customer_id: req.auth_context.actor_id,
      company: req.validatedBody as ModuleCreateCompany,
    },
    container: req.scope,
  });

  const {
    data: [company],
  } = await query.graph(
    {
      entity: "company",
      fields: req.queryConfig.fields,
      filters: { id: createdCompany.id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ company });
};
