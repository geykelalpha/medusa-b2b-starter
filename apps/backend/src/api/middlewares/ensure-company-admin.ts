import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Allows the request only if the authenticated customer is an admin
 * employee of the company in `req.params.id`.
 */
export const ensureCompanyAdmin = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.is_admin", "employee.company_id"],
    filters: { id: req.auth_context.actor_id },
  });

  const employee = customer?.employee;

  if (employee?.is_admin && employee.company_id === req.params.id) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden" });
};
