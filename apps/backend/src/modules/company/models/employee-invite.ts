import { model } from "@medusajs/framework/utils";
import { Company } from "./company";

export const EmployeeInvite = model
  .define("employee_invite", {
    id: model
      .id({
        prefix: "einv",
      })
      .primaryKey(),
    email: model.text(),
    first_name: model.text().nullable(),
    last_name: model.text().nullable(),
    phone: model.text().nullable(),
    spending_limit: model.bigNumber().default(0),
    is_admin: model.boolean().default(false),
    token_hash: model.text().unique(),
    expires_at: model.dateTime(),
    status: model.enum(["pending", "accepted", "revoked"]).default("pending"),
    accepted_at: model.dateTime().nullable(),
    invited_by: model.text().nullable(),
    employee_id: model.text().nullable(),
    company: model.belongsTo(() => Company, {
      mappedBy: "invites",
    }),
  })
  .indexes([
    {
      on: ["email"],
    },
  ]);
