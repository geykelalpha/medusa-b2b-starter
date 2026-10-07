"use client"

import { createInvite } from "@/lib/data/invites"
import Button from "@/modules/common/components/button"
import Input from "@/modules/common/components/input"
import NativeSelect from "@/modules/common/components/native-select"
import PlaceUnderSelect from "@/modules/account/components/employees-card/place-under-select"
import { QueryCompany } from "@/types"
import { Container, Text, toast } from "@medusajs/ui"
import { useRef, useState } from "react"

/**
 * Invite form. The parent is controlled by the employees section, so
 * "Invite under" on an employee row can preset it.
 */
const InviteEmployeeCard = ({
  company,
  parentId,
  onParentChange,
}: {
  company: QueryCompany
  parentId: string | null
  onParentChange: (parentId: string | null) => void
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
      parent_employee_id: parentId,
    })

    setIsSending(false)

    if (error) {
      toast.error(error)
      return
    }

    formRef.current?.reset()
    onParentChange(null)
    toast.success(`Invite sent to ${email}`)
  }

  return (
    <Container className="p-0 overflow-hidden">
      <form ref={formRef} action={handleSubmit}>
        <div className="grid small:grid-cols-4 grid-cols-2 gap-4 p-4">
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
        <div className="grid small:grid-cols-4 grid-cols-2 gap-4 px-4 pb-4 border-b border-neutral-200">
          <div className="flex flex-col gap-y-2 col-span-2">
            <Text className="font-medium text-neutral-950">Place under</Text>
            <PlaceUnderSelect
              employees={company.employees ?? []}
              value={parentId}
              onChange={onParentChange}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 bg-neutral-50 p-4">
          <Button variant="primary" type="submit" isLoading={isSending}>
            Send Invite
          </Button>
        </div>
      </form>
    </Container>
  )
}

export default InviteEmployeeCard
