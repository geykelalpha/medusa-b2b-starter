import { z } from "@medusajs/framework/zod";

export type StoreAcceptEmployeeInviteType = z.infer<
  typeof StoreAcceptEmployeeInvite
>;
export const StoreAcceptEmployeeInvite = z
  .object({
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  })
  .strict();
