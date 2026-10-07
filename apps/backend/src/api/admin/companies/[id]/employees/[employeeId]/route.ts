import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  deleteEmployeesWorkflow,
  updateEmployeesWorkflow,
} from "../../../../../../workflows/employee/workflows";
import {
  AdminGetEmployeeParamsType,
  AdminUpdateEmployeeType,
} from "../../../validators";

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetEmployeeParamsType>,
  res: MedusaResponse
) => {
  const { id, employeeId } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [employee],
  } = await query.graph(
    {
      entity: "employee",
      fields: req.queryConfig?.fields,
      filters: { ...req.filterableFields, id: employeeId },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ employee });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateEmployeeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id, employeeId } = req.params;
  const { spending_limit, is_admin, parent_employee_id } = req.body;

  await updateEmployeesWorkflow.run({
    input: {
      id: employeeId,
      company_id: id,
      spending_limit,
      is_admin,
      parent_employee_id,
    },
    container: req.scope,
  });

  const {
    data: [employee],
  } = await query.graph(
    {
      entity: "employee",
      fields: req.queryConfig?.fields,
      filters: { ...req.filterableFields, id: employeeId },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ employee });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id, employeeId } = req.params;

  await deleteEmployeesWorkflow.run({
    input: { company_id: id, employee_ids: [employeeId] },
    container: req.scope,
  });

  res.status(200).json({
    id: employeeId,
    object: "employee",
    deleted: true,
  });
};
