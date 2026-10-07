import { model } from "@medusajs/framework/utils";
import { Company } from "./company";

export const Employee = model
  .define("employee", {
    id: model
      .id({
        prefix: "emp",
      })
      .primaryKey(),
    spending_limit: model.bigNumber().default(0),
    is_admin: model.boolean().default(false),
    // The company's owner. Always an admin, and at most one per company.
    is_owner: model.boolean().default(false),
    company: model.belongsTo(() => Company, {
      mappedBy: "employees",
    }),
    // Optional parent in the company's employee tree. Null means top level.
    parent_employee: model
      .belongsTo(() => Employee, {
        mappedBy: "child_employees",
      })
      .nullable(),
    child_employees: model.hasMany(() => Employee, {
      mappedBy: "parent_employee",
    }),
  })
  .indexes([
    {
      on: ["company_id"],
      unique: true,
      where: "is_owner = true AND deleted_at IS NULL",
    },
  ]);
