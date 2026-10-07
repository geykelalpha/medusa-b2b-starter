export enum ModuleCompanySpendingLimitResetFrequency {
  NEVER = "never",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export type ModuleCompany = {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  logo_url: string | null
  currency_code: string | null
  spending_limit_reset_frequency: ModuleCompanySpendingLimitResetFrequency
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ModuleEmployee = {
  id: string
  company_id: string
  spending_limit: number
  is_admin: boolean
  is_owner: boolean
  parent_employee_id: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export type ModuleEmployeeInviteStatus = "pending" | "accepted" | "revoked"

export type ModuleEmployeeInvite = {
  id: string
  company_id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  spending_limit: number
  is_admin: boolean
  status: ModuleEmployeeInviteStatus
  expires_at: string
  accepted_at: string | null
  employee_id: string | null
  parent_employee_id: string | null
  created_at?: string
  updated_at?: string
}
