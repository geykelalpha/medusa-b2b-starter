import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261005222916 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "employee" drop constraint if exists "employee_company_id_unique";`);
    this.addSql(`alter table if exists "employee" add column if not exists "is_owner" boolean not null default false;`);
    // Backfill: the oldest admin of each company becomes its owner
    this.addSql(`update "employee" set "is_owner" = true where "id" in (select distinct on ("company_id") "id" from "employee" where "is_admin" = true and "deleted_at" is null order by "company_id", "created_at" asc);`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_employee_company_id_unique" ON "employee" ("company_id") WHERE is_owner = true AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_employee_company_id_unique";`);
    this.addSql(`alter table if exists "employee" drop column if exists "is_owner";`);
  }

}
