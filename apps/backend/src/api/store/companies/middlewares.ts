import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { authenticate } from "@medusajs/medusa";
import { ensureCompanyAdmin } from "../../middlewares/ensure-company-admin";
import { ensureRole } from "../../middlewares/ensure-role";
import {
  storeCompanyQueryConfig,
  storeEmployeeInviteQueryConfig,
  storeEmployeeQueryConfig,
} from "./query-config";
import {
  StoreCreateCompany,
  StoreCreateEmployee,
  StoreCreateEmployeeInvite,
  StoreGetEmployeeInvitesParams,
  StoreGetCompanyParams,
  StoreGetEmployeeParams,
  StoreUpdateApprovalSettings,
  StoreUpdateEmployee,
} from "./validators";

export const storeCompaniesMiddlewares: MiddlewareRoute[] = [
  /* Company middlewares */
  {
    method: "ALL",
    matcher: "/store/companies*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/companies",
    middlewares: [
      validateAndTransformQuery(
        StoreGetCompanyParams,
        storeCompanyQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/companies",
    middlewares: [
      validateAndTransformBody(StoreCreateCompany),
      validateAndTransformQuery(
        StoreGetCompanyParams,
        storeCompanyQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/companies/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetCompanyParams,
        storeCompanyQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/companies/:id",
    middlewares: [
      ensureCompanyAdmin,
      validateAndTransformQuery(
        StoreGetCompanyParams,
        storeCompanyQueryConfig.retrieve
      ),
    ],
  },

  {
    method: ["DELETE"],
    matcher: "/store/companies/:id",
    middlewares: [ensureCompanyAdmin],
  },

  /* Employee middlewares */
  {
    method: ["GET"],
    matcher: "/store/companies/:id/employees",
    middlewares: [
      validateAndTransformQuery(
        StoreGetEmployeeParams,
        storeEmployeeQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/companies/:id/employees",
    middlewares: [
      ensureRole("company_admin"),
      validateAndTransformBody(StoreCreateEmployee),
      validateAndTransformQuery(
        StoreGetEmployeeParams,
        storeEmployeeQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/companies/:id/employees/:employee_id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetEmployeeParams,
        storeEmployeeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/companies/:id/employees/:employee_id",
    middlewares: [
      ensureCompanyAdmin,
      validateAndTransformBody(StoreUpdateEmployee),
      validateAndTransformQuery(
        StoreGetEmployeeParams,
        storeEmployeeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/companies/:id/approval-settings",
    middlewares: [
      ensureRole("company_admin"),
      validateAndTransformBody(StoreUpdateApprovalSettings),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/companies/:id/employees/:employee_id",
    middlewares: [ensureCompanyAdmin],
  },
  /* Employee invite middlewares */
  {
    method: ["GET"],
    matcher: "/store/companies/:id/invites",
    middlewares: [
      ensureCompanyAdmin,
      validateAndTransformQuery(
        StoreGetEmployeeInvitesParams,
        storeEmployeeInviteQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/companies/:id/invites",
    middlewares: [validateAndTransformBody(StoreCreateEmployeeInvite)],
  },
];
