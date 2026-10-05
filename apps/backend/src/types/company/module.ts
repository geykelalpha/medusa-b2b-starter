/* Entity: Company */

import { CustomerGroupDTO } from "@medusajs/framework/types";
import { CustomerDTO } from "@medusajs/framework/types";
import { ModuleApprovalSettings } from "../approval/module";

export enum ModuleCompanySpendingLimitResetFrequency {
  NEVER = "never",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export type ModuleCompany = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  logo_url: string | null;
  currency_code: string | null;
  spending_limit_reset_frequency: ModuleCompanySpendingLimitResetFrequency;
  created_at: Date;
  updated_at: Date;
  customer_group: CustomerGroupDTO;
  approval_settings: ModuleApprovalSettings;
};

export type ModuleCreateCompany = {
  name: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  logo_url: string | null;
  currency_code: string;
  spending_limit_reset_frequency: ModuleCompanySpendingLimitResetFrequency | null;
};

export interface ModuleUpdateCompany extends Partial<ModuleCompany> {
  id: string;
}

export type ModuleDeleteCompany = {
  id: string;
};

/* Entity: Employee */

export interface ModuleEmployee {
  id: string;
  spending_limit: number;
  is_admin: boolean;
  company_id: string;
  created_at: Date;
  updated_at: Date;
  customer: CustomerDTO;
  company: ModuleCompany;
}

export type ModuleCreateEmployee = {
  customer_id: string;
  spending_limit: number;
  is_admin: boolean;
  company_id: string;
};

export interface ModuleUpdateEmployee extends Partial<ModuleEmployee> {
  id: string;
}

export type ModuleDeleteEmployee = {
  id: string;
};

/* Entity: Employee Invite */

export type ModuleEmployeeInviteStatus = "pending" | "accepted" | "revoked";

export interface ModuleEmployeeInvite {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  spending_limit: number;
  is_admin: boolean;
  token_hash: string;
  expires_at: Date;
  status: ModuleEmployeeInviteStatus;
  accepted_at: Date | null;
  invited_by: string | null;
  employee_id: string | null;
  company_id: string;
  created_at: Date;
  updated_at: Date;
  company?: ModuleCompany;
}

export type ModuleCreateEmployeeInvite = {
  company_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  spending_limit?: number;
  is_admin?: boolean;
  token_hash: string;
  expires_at: Date;
  invited_by?: string | null;
};

export interface ModuleUpdateEmployeeInvite
  extends Partial<Omit<ModuleEmployeeInvite, "company">> {
  id: string;
}
