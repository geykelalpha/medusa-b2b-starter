import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  AdminEmployeeInviteResponse,
  AdminEmployeeInvitesResponse,
  QueryEmployeeInvite,
} from "../../../../../types";
import { createEmployeeInviteWorkflow } from "../../../../../workflows/employee-invite/workflows";
import { retrieveInvite } from "../../../../utils/employee-invites";
import {
  AdminCreateEmployeeInviteType,
  AdminGetEmployeeInvitesParamsType,
} from "../../validators";

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetEmployeeInvitesParamsType>,
  res: MedusaResponse<AdminEmployeeInvitesResponse>
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
  req: AuthenticatedMedusaRequest<AdminCreateEmployeeInviteType>,
  res: MedusaResponse<AdminEmployeeInviteResponse>
) => {
  const { result } = await createEmployeeInviteWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      company_id: req.params.id,
      actor: { type: "user", id: req.auth_context.actor_id },
    },
  });

  const invite = await retrieveInvite(req.scope, result.id);

  res.json({ invite });
};
