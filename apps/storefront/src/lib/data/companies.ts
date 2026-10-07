"use server"

import { sdk } from "@/lib/config"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
} from "@/lib/data/cookies"
import {
  StoreCompanyResponse,
  StoreCreateCompany,
  StoreEmployeeResponse,
  StoreUpdateCompany,
  StoreUpdateEmployee,
} from "@/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"
import { companyFromFormData } from "@/lib/util/company-form"
import { retrieveCustomer, syncCustomerSession } from "./customer"

export const retrieveCompany = async (companyId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("companies")),
  }

  const { company } = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/companies/${companyId}`,
    {
      query: {
        fields:
          "+spending_limit_reset_frequency,*employees.customer,*approval_settings",
      },
      method: "GET",
      headers,
      next,
    }
  )

  return company
}

/**
 * Creates a company for the logged-in customer, who becomes its admin.
 * Throws on failure.
 */
export const createCompany = async (data: StoreCreateCompany) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const { company } = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/companies`,
    {
      method: "POST",
      body: data,
      headers,
    }
  )

  track("company_created", {
    company_id: company.id,
    company_name: company.name,
  })

  const [companiesCacheTag, customersCacheTag] = await Promise.all([
    getCacheTag("companies"),
    getCacheTag("customers"),
  ])
  revalidateTag(companiesCacheTag)
  revalidateTag(customersCacheTag)

  return company
}

/**
 * Server action for the account's "create a company" form. Returns
 * `{ error }` instead of throwing so the message reaches the client.
 */
export const createMyCompany = async (
  _currentState: unknown,
  formData: FormData
): Promise<{ error: string | null }> => {
  const customer = await retrieveCustomer()

  if (!customer) {
    return { error: "You must be logged in to create a company" }
  }

  try {
    await createCompany(companyFromFormData(formData, customer.email))
  } catch (error: any) {
    return { error: error?.message || "Could not create the company" }
  }

  await syncCustomerSession()

  return { error: null }
}

export const updateCompany = async (data: StoreUpdateCompany) => {
  const { id, ...companyData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const company = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/companies/${id}`,
    {
      method: "POST",
      body: companyData,
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return company
}

/**
 * Updates an employee's spending limit, role or place in the tree.
 * Returns `{ error }` instead of throwing so the message reaches the client.
 */
export const updateEmployee = async (
  data: StoreUpdateEmployee
): Promise<{ error: string | null }> => {
  const { id, company_id, ...employeeData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch<StoreEmployeeResponse>(
      `/store/companies/${company_id}/employees/${id}`,
      {
        method: "POST",
        body: employeeData,
        headers,
      }
    )
  } catch (error: any) {
    return { error: error?.message || "Could not update the employee" }
  }

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return { error: null }
}

/**
 * Removes an employee. Everyone under them moves up a level, along with
 * pending invites, so both caches are revalidated.
 */
export const deleteEmployee = async (
  companyId: string,
  employeeId: string
): Promise<{ error: string | null }> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch(
      `/store/companies/${companyId}/employees/${employeeId}`,
      {
        method: "DELETE",
        headers,
      }
    )
  } catch (error: any) {
    return { error: error?.message || "Could not remove the employee" }
  }

  const [companiesCacheTag, invitesCacheTag] = await Promise.all([
    getCacheTag("companies"),
    getCacheTag("invites"),
  ])
  revalidateTag(companiesCacheTag)
  revalidateTag(invitesCacheTag)

  return { error: null }
}

/**
 * Makes another admin the company owner. Only the current owner can do this.
 * Returns `{ error }` instead of throwing so the message reaches the client.
 */
export const transferCompanyOwnership = async (
  companyId: string,
  employeeId: string
): Promise<{ error: string | null }> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch<StoreCompanyResponse>(
      `/store/companies/${companyId}/transfer-ownership`,
      {
        method: "POST",
        body: { employee_id: employeeId },
        headers,
      }
    )
  } catch (error: any) {
    return { error: error?.message || "Could not transfer ownership" }
  }

  const [companiesCacheTag, customersCacheTag] = await Promise.all([
    getCacheTag("companies"),
    getCacheTag("customers"),
  ])
  revalidateTag(companiesCacheTag)
  revalidateTag(customersCacheTag)

  return { error: null }
}

export const updateApprovalSettings = async (
  companyId: string,
  requiresAdminApproval: boolean
) => {
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    Accept: "plain/text",
  }

  await sdk.client.fetch(`/store/companies/${companyId}/approval-settings`, {
    method: "POST",
    body: {
      requires_admin_approval: requiresAdminApproval,
    },
    headers,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)
}
