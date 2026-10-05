import { validateAndTransformBody } from "@medusajs/framework";
import { authenticate, MiddlewareRoute } from "@medusajs/medusa";
import { StoreAcceptEmployeeInvite } from "./validators";

export const storeEmployeeInvitesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/employee-invites/:token/accept",
    middlewares: [
      // Unregistered identities (fresh sign-ups) accept to create their account
      authenticate("customer", ["session", "bearer"], {
        allowUnregistered: true,
      }),
      validateAndTransformBody(StoreAcceptEmployeeInvite),
    ],
  },
];
