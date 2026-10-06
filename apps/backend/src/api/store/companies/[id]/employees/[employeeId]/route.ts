import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  deleteEmployeesWorkflow,
  updateEmployeesWorkflow,
} from "../../../../../../workflows/employee/workflows";
import {
  StoreGetEmployeeParamsType,
  StoreUpdateEmployeeType,
} from "../../../validators";

export const GET = async (
  req: MedusaRequest<StoreGetEmployeeParamsType>,
  res: MedusaResponse
) => {
  const { employeeId } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [employee],
  } = await query.graph(
    {
      entity: "employee",
      // TODO: fix this
      fields: req.queryConfig.fields,
      filters: {
        ...req.filterableFields,
        id: employeeId,
      },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ employee });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreUpdateEmployeeType>,
  res: MedusaResponse
) => {
  const { id, employeeId } = req.params;
  const { spending_limit, is_admin } = req.validatedBody;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  await updateEmployeesWorkflow.run({
    input: {
      id: employeeId,
      company_id: id,
      spending_limit,
      is_admin,
      requested_by_customer_id: req.auth_context.actor_id,
    },
    container: req.scope,
  });

  const {
    data: [employee],
  } = await query.graph(
    {
      entity: "employee",
      // TODO: fix this
      fields: req.queryConfig.fields,
      filters: {
        ...req.filterableFields,
        id: employeeId,
      },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ employee });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id, employeeId } = req.params;

  await deleteEmployeesWorkflow.run({
    input: { company_id: id, employee_ids: [employeeId] },
    container: req.scope,
  });

  res.json({
    id: employeeId,
    object: "employee",
    deleted: true,
  });
};
