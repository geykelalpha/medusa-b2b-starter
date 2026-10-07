"use client"

import { resendInvite, revokeInvite } from "@/lib/data/invites"
import Button from "@/modules/common/components/button"
import { ModuleEmployeeInvite } from "@/types"
import { Text, toast } from "@medusajs/ui"
import { useState } from "react"

/** A pending invite, shown in the tree under its future parent. */
const PendingInvite = ({
  invite,
  companyId,
  depth,
}: {
  invite: ModuleEmployeeInvite
  companyId: string
  depth: number
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
    <div className="flex justify-between items-center gap-2 p-4 border-b border-neutral-200 bg-neutral-50">
      <div
        className="flex flex-col min-w-0"
        // Line up with employee names, which follow a toggle (w-5 + gap-2)
        style={{ paddingLeft: depth * 24 + 28 }}
      >
        <Text className="text-neutral-500 font-medium italic">
          {name || invite.email}
          {" • "}
          <span className="text-orange-500 not-italic">Invited</span>
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

export default PendingInvite
