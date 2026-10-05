import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261005180723 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "employee_invite" ("id" text not null, "email" text not null, "first_name" text null, "last_name" text null, "phone" text null, "spending_limit" numeric not null default 0, "is_admin" boolean not null default false, "token_hash" text not null, "expires_at" timestamptz not null, "status" text check ("status" in ('pending', 'accepted', 'revoked')) not null default 'pending', "accepted_at" timestamptz null, "invited_by" text null, "employee_id" text null, "company_id" text not null, "raw_spending_limit" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "employee_invite_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_employee_invite_token_hash_unique" ON "employee_invite" ("token_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_employee_invite_company_id" ON "employee_invite" ("company_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_employee_invite_deleted_at" ON "employee_invite" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_employee_invite_email" ON "employee_invite" ("email") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "employee_invite" add constraint "employee_invite_company_id_foreign" foreign key ("company_id") references "company" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "employee_invite" drop constraint if exists "employee_invite_company_id_foreign";`);

    this.addSql(`drop table if exists "employee_invite" cascade;`);
  }

}
