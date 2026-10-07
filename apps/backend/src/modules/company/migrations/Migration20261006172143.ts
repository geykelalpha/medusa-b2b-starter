import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261006172143 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "employee" add column if not exists "parent_employee_id" text null;`);
    this.addSql(`alter table if exists "employee" add constraint "employee_parent_employee_id_foreign" foreign key ("parent_employee_id") references "employee" ("id") on update cascade on delete set null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_employee_parent_employee_id" ON "employee" ("parent_employee_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "employee_invite" add column if not exists "parent_employee_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "employee" drop constraint if exists "employee_parent_employee_id_foreign";`);

    this.addSql(`drop index if exists "IDX_employee_parent_employee_id";`);
    this.addSql(`alter table if exists "employee" drop column if exists "parent_employee_id";`);

    this.addSql(`alter table if exists "employee_invite" drop column if exists "parent_employee_id";`);
  }

}
