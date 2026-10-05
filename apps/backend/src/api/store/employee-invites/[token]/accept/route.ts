import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { QueryEmployee, StoreEmployeeResponse } from "../../../../../types";
import { acceptEmployeeInviteWorkflow } from "../../../../../workflows/employee-invite/workflows";
import { StoreAcceptEmployeeInviteType } from "../../validators";

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreAcceptEmployeeInviteType>,
  res: MedusaResponse<StoreEmployeeResponse>
) => {
  const { auth_identity_id, actor_id } = req.auth_context;

  const { result } = await acceptEmployeeInviteWorkflow(req.scope).run({
    input: {
      token: req.params.token,
      auth_identity_id: auth_identity_id!,
      // Empty for identities that don't have a customer account yet
      customer_id: actor_id || undefined,
      customer_data: req.validatedBody,
    },
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [employee],
  } = await query.graph(
    {
      entity: "employee",
      fields: ["id", "spending_limit", "is_admin", "company_id", "*company"],
      filters: { id: result.id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ employee: employee as unknown as QueryEmployee });
};
