"use client"

import { createInvite, resendInvite, revokeInvite } from "@/lib/data/invites"
import Button from "@/modules/common/components/button"
import Input from "@/modules/common/components/input"
import NativeSelect from "@/modules/common/components/native-select"
import { ModuleEmployeeInvite, QueryCompany } from "@/types"
import { Container, Text, toast } from "@medusajs/ui"
import { useRef, useState } from "react"

const PendingInvite = ({
  invite,
  companyId,
}: {
  invite: ModuleEmployeeInvite
  companyId: string
}) => {
  const [pendingAction, setPendingAction] = useState<
    "resend" | "revoke" | null
  >(null)

  const expired = new Date(invite.expires_at) <= new Date()
  const name = [invite.first_name, invite.last_name].filter(Boolean).join(" ")

  const handleResend = async () => {
    setPendingAction("resend")
    const { error } = await resendInvite(companyId, invite.id)
    setPendingAction(null)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(`Invite resent to ${invite.email}`)
  }

  const handleRevoke = async () => {
    setPendingAction("revoke")
    const { error } = await revokeInvite(companyId, invite.id)
    setPendingAction(null)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(`Invite for ${invite.email} revoked`)
  }

  return (
    <div className="flex justify-between items-center p-4 border-b border-neutral-200 last:border-b-0">
      <div className="flex flex-col">
        <Text className="text-neutral-950 font-medium">
          {name || invite.email}
          {invite.is_admin && (
            <>
              {" • "}
              <span className="text-blue-500">Admin</span>
            </>
          )}
        </Text>
        <div className="flex gap-x-2 small:flex-row flex-col">
          {name && <Text className="text-neutral-500">{invite.email}</Text>}
          {name && (
            <Text className="text-neutral-500 hidden small:block">{" • "}</Text>
          )}
          <Text className={expired ? "text-red-500" : "text-neutral-500"}>
            {expired
              ? "Invite expired"
              : `Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
          </Text>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="transparent"
          onClick={handleRevoke}
          isLoading={pendingAction === "revoke"}
          disabled={!!pendingAction}
        >
          Revoke
        </Button>
        <Button
          variant="secondary"
          onClick={handleResend}
          isLoading={pendingAction === "resend"}
          disabled={!!pendingAction}
        >
          Resend
        </Button>
      </div>
    </div>
  )
}

const InviteEmployeeCard = ({
  company,
  invites,
}: {
  company: QueryCompany
  invites: ModuleEmployeeInvite[]
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSending(true)

    const email = formData.get("email") as string

    const { error } = await createInvite(company.id, {
      email,
      first_name: (formData.get("first_name") as string) || null,
      last_name: (formData.get("last_name") as string) || null,
      is_admin: formData.get("permissions") === "admin",
    })

    setIsSending(false)

    if (error) {
      toast.error(error)
      return
    }

    formRef.current?.reset()
    toast.success(`Invite sent to ${email}`)
  }

  return (
    <Container className="p-0 overflow-hidden">
      <form ref={formRef} action={handleSubmit}>
        <div className="grid small:grid-cols-4 grid-cols-2 gap-4 p-4 border-b border-neutral-200">
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Name</Text>
            <Input name="first_name" label="First name" />
          </div>
          <div className="flex flex-col gap-y-2 justify-end">
            <Input name="last_name" label="Last name" />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Email</Text>
            <Input name="email" type="email" label="Enter an email" required />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">Permissions</Text>
            <NativeSelect name="permissions" defaultValue="employee">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </NativeSelect>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 bg-neutral-50 p-4">
          <Button variant="primary" type="submit" isLoading={isSending}>
            Send Invite
          </Button>
        </div>
      </form>
      {invites.length > 0 && (
        <div className="flex flex-col border-t border-neutral-200">
          <Text className="font-medium text-neutral-950 px-4 pt-4">
            Pending invites
          </Text>
          {invites.map((invite) => (
            <PendingInvite
              key={invite.id}
              invite={invite}
              companyId={company.id}
            />
          ))}
        </div>
      )}
    </Container>
  )
}

export default InviteEmployeeCard
