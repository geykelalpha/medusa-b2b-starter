"use server"

import { sdk } from "@/lib/config"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  setAuthToken,
} from "@/lib/data/cookies"
import { syncCustomerSession, transferCart } from "@/lib/data/customer"
import {
  StoreCreateEmployeeInvite,
  StoreEmployeeInvitePreview,
  StoreEmployeeInvitePreviewResponse,
  StoreEmployeeInviteResponse,
  StoreEmployeeInvitesResponse,
  StoreEmployeeResponse,
} from "@/types"
import { FetchError } from "@medusajs/js-sdk"
import { revalidateTag } from "next/cache"

type ActionResult = { error: string | null }

const toErrorMessage = (error: unknown) =>
  (error as FetchError)?.message || "Something went wrong, please try again"

const revalidateInvites = async () => {
  revalidateTag(await getCacheTag("invites"))
}

/* Company admin actions */

export const listInvites = async (companyId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("invites")),
  }

  const { invites } = await sdk.client.fetch<StoreEmployeeInvitesResponse>(
    `/store/companies/${companyId}/invites`,
    {
      method: "GET",
      query: { status: "pending" },
      headers,
      next,
    }
  )

  return invites
}

export const createInvite = async (
  companyId: string,
  data: StoreCreateEmployeeInvite
): Promise<ActionResult> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch<StoreEmployeeInviteResponse>(
      `/store/companies/${companyId}/invites`,
      {
        method: "POST",
        body: data,
        headers,
      }
    )
  } catch (error) {
    return { error: toErrorMessage(error) }
  }

  await revalidateInvites()

  return { error: null }
}

export const resendInvite = async (
  companyId: string,
  inviteId: string
): Promise<ActionResult> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch<StoreEmployeeInviteResponse>(
      `/store/companies/${companyId}/invites/${inviteId}/resend`,
      {
        method: "POST",
        headers,
      }
    )
  } catch (error) {
    return { error: toErrorMessage(error) }
  }

  await revalidateInvites()

  return { error: null }
}

export const revokeInvite = async (
  companyId: string,
  inviteId: string
): Promise<ActionResult> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch<StoreEmployeeInviteResponse>(
      `/store/companies/${companyId}/invites/${inviteId}`,
      {
        method: "DELETE",
        headers,
      }
    )
  } catch (error) {
    return { error: toErrorMessage(error) }
  }

  await revalidateInvites()

  return { error: null }
}

/* Invitee actions */

export const retrieveInvite = async (
  token: string
): Promise<StoreEmployeeInvitePreview | null> => {
  try {
    const { invite } =
      await sdk.client.fetch<StoreEmployeeInvitePreviewResponse>(
        `/store/employee-invites/${encodeURIComponent(token)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      )

    return invite
  } catch {
    return null
  }
}

const acceptInvite = async (token: string, authToken: string, body = {}) => {
  await sdk.client.fetch<StoreEmployeeResponse>(
    `/store/employee-invites/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      body,
      headers: { authorization: `Bearer ${authToken}` },
    }
  )
}

const completeLogin = async (authToken: string) => {
  await setAuthToken(authToken)
  await syncCustomerSession()
  await transferCart()
}

/**
 * Accepts an invite for someone without a storefront account: registers an
 * emailpass identity, accepts the invite (which creates the customer and
 * employee), then logs them in.
 */
export const acceptInviteWithNewAccount = async (
  _currentState: unknown,
  formData: FormData
): Promise<ActionResult> => {
  const token = formData.get("token") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (!password || password !== confirmPassword) {
    return { error: "Passwords don't match" }
  }

  try {
    const registrationToken = await sdk.auth
      .register("customer", "emailpass", { email, password })
      .catch(async (registerError) => {
        // A previous attempt may have registered the identity before failing to
        // accept; logging in yields a token for that same (customer-less) identity
        return sdk.auth
          .login("customer", "emailpass", { email, password })
          .catch(() => {
            throw registerError
          })
      })

    await acceptInvite(token, registrationToken as string, {
      first_name: (formData.get("first_name") as string) || undefined,
      last_name: (formData.get("last_name") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
    })

    // The registration token has no customer attached, so log in for a full session
    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    })

    await completeLogin(loginToken as string)
  } catch (error) {
    return { error: toErrorMessage(error) }
  }

  return { error: null }
}

/**
 * Accepts an invite for someone who already has a storefront account by
 * logging them in and linking their customer to the company.
 */
export const acceptInviteWithExistingAccount = async (
  _currentState: unknown,
  formData: FormData
): Promise<ActionResult> => {
  const token = formData.get("token") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    })

    if (typeof loginToken !== "string") {
      return { error: "Additional authentication is required" }
    }

    await acceptInvite(token, loginToken)
    await completeLogin(loginToken)
  } catch (error) {
    return { error: toErrorMessage(error) }
  }

  return { error: null }
}

/**
 * Accepts an invite as the currently logged-in customer.
 */
export const acceptInviteAsCurrentCustomer = async (
  token: string
): Promise<ActionResult> => {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return { error: "You need to log in to accept this invite" }
  }

  try {
    await acceptInvite(token, headers.authorization.replace(/^Bearer /, ""))
    await syncCustomerSession()
  } catch (error) {
    return { error: toErrorMessage(error) }
  }

  return { error: null }
}
