import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  StoreEmployeeInviteResponse,
  StoreEmployeeInvitesResponse,
  QueryEmployeeInvite,
} from "../../../../../types";
import { createEmployeeInviteWorkflow } from "../../../../../workflows/employee-invite/workflows";
import { retrieveInvite } from "../../../../utils/employee-invites";
import {
  StoreCreateEmployeeInviteType,
  StoreGetEmployeeInvitesParamsType,
} from "../../validators";

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetEmployeeInvitesParamsType>,
  res: MedusaResponse<StoreEmployeeInvitesResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: invites } = await query.graph({
    entity: "employee_invite",
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      company_id: req.params.id,
    },
    pagination: req.queryConfig.pagination,
  });

  res.json({ invites: invites as unknown as QueryEmployeeInvite[] });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateEmployeeInviteType>,
  res: MedusaResponse<StoreEmployeeInviteResponse>
) => {
  const { result } = await createEmployeeInviteWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      company_id: req.params.id,
      actor: { type: "customer", id: req.auth_context.actor_id },
    },
  });

  const invite = await retrieveInvite(req.scope, result.id);

  res.json({ invite });
};
