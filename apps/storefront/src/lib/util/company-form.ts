import { StoreCreateCompany } from "@/types"

/** Names of the company inputs rendered by `CompanyFields`. */
export const COMPANY_FIELD_NAMES = [
  "company_name",
  "company_address",
  "company_city",
  "company_state",
  "company_zip",
  "company_country",
  "currency_code",
] as const

export type CompanyFieldName = (typeof COMPANY_FIELD_NAMES)[number]

export type CompanyFieldValues = Record<CompanyFieldName, string>

export const emptyCompanyFieldValues: CompanyFieldValues = {
  company_name: "",
  company_address: "",
  company_city: "",
  company_state: "",
  company_zip: "",
  company_country: "",
  currency_code: "",
}

/** Every company field is required except the state. */
export const isCompanyFieldValuesValid = (values: CompanyFieldValues) =>
  COMPANY_FIELD_NAMES.every(
    (name) => name === "company_state" || !!values[name]
  )

/** Builds the create-company payload from a form rendered with `CompanyFields`. */
export const companyFromFormData = (
  formData: FormData,
  email: string
): StoreCreateCompany => ({
  name: formData.get("company_name") as string,
  email,
  phone: (formData.get("company_phone") as string) || null,
  address: formData.get("company_address") as string,
  city: formData.get("company_city") as string,
  state: (formData.get("company_state") as string) || null,
  zip: formData.get("company_zip") as string,
  country: formData.get("company_country") as string,
  currency_code: formData.get("currency_code") as string,
})
