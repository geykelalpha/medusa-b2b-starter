"use client"

import {
  acceptInviteAsCurrentCustomer,
  acceptInviteWithExistingAccount,
  acceptInviteWithNewAccount,
} from "@/lib/data/invites"
import ErrorMessage from "@/modules/checkout/components/error-message"
import { SubmitButton } from "@/modules/checkout/components/submit-button"
import Button from "@/modules/common/components/button"
import Input from "@/modules/common/components/input"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { StoreEmployeeInvitePreview } from "@/types"
import { Text } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"

type Props = {
  token: string
  invite: StoreEmployeeInvitePreview | null
  countryCode: string
  currentCustomer: { email: string; hasCompany: boolean } | null
}

const InviteUnavailable = ({ message }: { message: string }) => (
  <div className="max-w-sm w-full flex flex-col gap-6">
    <Text className="text-4xl text-neutral-950">Invite unavailable</Text>
    <Text className="text-neutral-600">{message}</Text>
    <LocalizedClientLink href="/account">
      <Button variant="secondary" className="w-full">
        Go to your account
      </Button>
    </LocalizedClientLink>
  </div>
)

const useRedirectOnSuccess = (
  state: { error: string | null } | null,
  countryCode: string
) => {
  const router = useRouter()

  useEffect(() => {
    if (state && !state.error) {
      router.push(`/${countryCode}/account/company`)
      router.refresh()
    }
  }, [state, countryCode, router])
}

const NewAccountForm = ({
  token,
  invite,
  countryCode,
}: {
  token: string
  invite: StoreEmployeeInvitePreview
  countryCode: string
}) => {
  const [state, formAction] = useActionState(acceptInviteWithNewAccount, null)
  useRedirectOnSuccess(state, countryCode)

  return (
    <form className="w-full flex flex-col gap-y-2" action={formAction}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={invite.email} />
      <Input label="Email" name="email_display" value={invite.email} disabled />
      <Input
        label="First name"
        name="first_name"
        autoComplete="given-name"
        defaultValue={invite.first_name ?? ""}
        required
      />
      <Input
        label="Last name"
        name="last_name"
        autoComplete="family-name"
        defaultValue={invite.last_name ?? ""}
        required
      />
      <Input label="Phone" name="phone" type="tel" autoComplete="tel" />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
      />
      <Input
        label="Confirm password"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
      />
      <ErrorMessage error={state?.error} />
      <SubmitButton className="w-full mt-4">
        Create account &amp; join
      </SubmitButton>
    </form>
  )
}

const ExistingAccountForm = ({
  token,
  invite,
  countryCode,
}: {
  token: string
  invite: StoreEmployeeInvitePreview
  countryCode: string
}) => {
  const [state, formAction] = useActionState(
    acceptInviteWithExistingAccount,
    null
  )
  useRedirectOnSuccess(state, countryCode)

  return (
    <form className="w-full flex flex-col gap-y-2" action={formAction}>
      <Text className="text-neutral-600">
        You already have an account. Log in to join {invite.company.name}.
      </Text>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={invite.email} />
      <Input label="Email" name="email_display" value={invite.email} disabled />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <ErrorMessage error={state?.error} />
      <SubmitButton className="w-full mt-4">Log in &amp; join</SubmitButton>
    </form>
  )
}

const AcceptAsCurrentCustomer = ({
  token,
  invite,
  countryCode,
}: {
  token: string
  invite: StoreEmployeeInvitePreview
  countryCode: string
}) => {
  const [isAccepting, setIsAccepting] = useState(false)
  const [state, setState] = useState<{ error: string | null } | null>(null)
  useRedirectOnSuccess(state, countryCode)

  const handleAccept = async () => {
    setIsAccepting(true)
    setState(await acceptInviteAsCurrentCustomer(token))
    setIsAccepting(false)
  }

  return (
    <div className="w-full flex flex-col gap-y-2">
      <Text className="text-neutral-600">
        You&apos;re logged in as {invite.email}.
      </Text>
      <ErrorMessage error={state?.error} />
      <Button
        className="w-full mt-4"
        onClick={handleAccept}
        isLoading={isAccepting}
      >
        Join {invite.company.name}
      </Button>
    </div>
  )
}

const AcceptInvite = ({ token, invite, countryCode, currentCustomer }: Props) => {
  if (!token || !invite) {
    return (
      <InviteUnavailable message="This invite link is invalid. Ask your company admin to send you a new one." />
    )
  }

  if (invite.status === "accepted") {
    return (
      <InviteUnavailable message="This invite has already been accepted. Log in with your account to continue." />
    )
  }

  if (invite.status === "revoked") {
    return (
      <InviteUnavailable message="This invite has been revoked. Ask your company admin to send you a new one." />
    )
  }

  if (invite.expired) {
    return (
      <InviteUnavailable message="This invite has expired. Ask your company admin to resend it." />
    )
  }

  const isInvitedCustomer =
    currentCustomer?.email?.toLowerCase() === invite.email.toLowerCase()

  if (isInvitedCustomer && currentCustomer?.hasCompany) {
    return (
      <InviteUnavailable message="Your account already belongs to a company." />
    )
  }

  return (
    <div className="max-w-sm w-full flex flex-col gap-6">
      <Text className="text-4xl text-neutral-950">
        Join {invite.company.name}
      </Text>
      {currentCustomer && !isInvitedCustomer && (
        <Text className="text-neutral-600">
          You&apos;re currently logged in as {currentCustomer.email}. This
          invite was sent to {invite.email}; continuing will sign you in as
          that account.
        </Text>
      )}
      {isInvitedCustomer ? (
        <AcceptAsCurrentCustomer
          token={token}
          invite={invite}
          countryCode={countryCode}
        />
      ) : invite.has_account ? (
        <ExistingAccountForm
          token={token}
          invite={invite}
          countryCode={countryCode}
        />
      ) : (
        <NewAccountForm
          token={token}
          invite={invite}
          countryCode={countryCode}
        />
      )}
    </div>
  )
}

export default AcceptInvite
