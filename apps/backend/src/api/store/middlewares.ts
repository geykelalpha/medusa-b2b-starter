import { MiddlewareRoute } from "@medusajs/medusa";
import { storeApprovalsMiddlewares } from "./approvals/middlewares";
import { storeCartsMiddlewares } from "./carts/middlewares";
import { storeCompaniesMiddlewares } from "./companies/middlewares";
import { storeEmployeeInvitesMiddlewares } from "./employee-invites/middlewares";
import { storeFreeShippingMiddlewares } from "./free-shipping/middlewares";
import { storeQuotesMiddlewares } from "./quotes/middlewares";
import { storeSearchMiddlewares } from "./search/middlewares";

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeCartsMiddlewares,
  ...storeCompaniesMiddlewares,
  ...storeEmployeeInvitesMiddlewares,
  ...storeQuotesMiddlewares,
  ...storeFreeShippingMiddlewares,
  ...storeApprovalsMiddlewares,
  ...storeSearchMiddlewares,
];
