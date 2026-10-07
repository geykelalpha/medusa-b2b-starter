"use client"

import { currencySymbolMap } from "@/lib/constants"
import {
  deleteEmployee,
  transferCompanyOwnership,
  updateEmployee,
} from "@/lib/data/companies"
import {
  getOrderTotalInSpendWindow,
  getSpendWindow,
} from "@/lib/util/check-spending-limit"
import { employeeName } from "@/lib/util/employee-tree"
import { formatAmount } from "@/modules/common/components/amount-cell"
import Button from "@/modules/common/components/button"
import NativeSelect from "@/modules/common/components/native-select"
import {
  B2BCustomer,
  QueryCompany,
  QueryEmployee,
  StoreUpdateEmployee,
} from "@/types"
import { HttpTypes } from "@medusajs/types"
import { CurrencyInput, Prompt, Text, clx, toast } from "@medusajs/ui"
import { useState } from "react"
import PlaceUnderSelect from "./place-under-select"
import TreeToggle from "./tree-toggle"

const RemoveEmployeePrompt = ({
  employee,
  childrenDestination,
}: {
  employee: QueryEmployee
  /** Where the employee's children go, or null when it has none. */
  childrenDestination: string | null
}) => {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    setIsRemoving(true)
    const { error } = await deleteEmployee(employee.company_id, employee.id)
    setIsRemoving(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success("Employee removed")
  }

  return (
    <Prompt variant="danger">
      <Prompt.Trigger asChild>
        <Button variant="transparent" disabled={isRemoving}>
          Remove
        </Button>
      </Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Remove Employee</Prompt.Title>
          <Prompt.Description>
            Are you sure you want to remove{" "}
            <strong>{employee.customer.email}</strong> from your team? They will
            no longer be able to purchase on behalf of your company.
            {childrenDestination &&
              ` Everyone under them will be moved ${childrenDestination}.`}
          </Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel className="h-10 rounded-full shadow-borders-base">
            Cancel
          </Prompt.Cancel>
          <Prompt.Action
            className="h-10 px-4 rounded-full shadow-none"
            onClick={handleRemove}
          >
            Remove
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const TransferOwnershipPrompt = ({ employee }: { employee: QueryEmployee }) => {
  const [isTransferring, setIsTransferring] = useState(false)

  const handleTransfer = async () => {
    setIsTransferring(true)
    const { error } = await transferCompanyOwnership(
      employee.company_id,
      employee.id
    )
    setIsTransferring(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success("Ownership transferred")
  }

  return (
    <Prompt>
      <Prompt.Trigger asChild>
        <Button variant="transparent" disabled={isTransferring}>
          Make owner
        </Button>
      </Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Transfer Ownership</Prompt.Title>
          <Prompt.Description>
            Make <strong>{employee.customer.email}</strong> the owner of your
            company? You will stay an admin, but only the new owner can transfer
            ownership again or remove you.
          </Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel className="h-10 rounded-full shadow-borders-base">
            Cancel
          </Prompt.Cancel>
          <Prompt.Action
            className="h-10 px-4 rounded-full shadow-none"
            onClick={handleTransfer}
          >
            Transfer
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const Employee = ({
  employee,
  company,
  orders,
  customer,
  depth,
  childCount,
  isCollapsed,
  onToggle,
  onInviteUnder,
}: {
  employee: QueryEmployee
  company: QueryCompany
  orders: HttpTypes.StoreOrder[]
  customer: B2BCustomer | null
  depth: number
  childCount: number
  isCollapsed: boolean
  onToggle: () => void
  onInviteUnder: (employee: QueryEmployee) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [employeeData, setEmployeeData] = useState({
    id: employee.id,
    company_id: employee.company_id,
    spending_limit: employee.spending_limit.toString(),
    is_admin: employee.is_admin,
    parent_employee_id: employee.parent_employee_id,
  })

  const employees = company.employees ?? []
  const isCurrentUser = employee.customer.id === customer?.id
  const isViewerAdmin = !!customer?.employee?.is_admin
  const isCurrentUserOwner = !!customer?.employee?.is_owner
  // Only the owner can edit the owner's own record
  const canManage = isViewerAdmin && (!employee.is_owner || isCurrentUser)
  // The owner can't be removed until ownership is transferred
  const canRemove = !isCurrentUser && !employee.is_owner
  const canMakeOwner = isCurrentUserOwner && !isCurrentUser && employee.is_admin

  const parent = employees.find((e) => e.id === employee.parent_employee_id)
  const childrenDestination =
    childCount > 0
      ? parent
        ? `under ${employeeName(parent)}`
        : "to the top level"
      : null

  const startEditing = () => {
    // Start from the current values, which may have changed since mount
    setEmployeeData({
      id: employee.id,
      company_id: employee.company_id,
      spending_limit: employee.spending_limit.toString(),
      is_admin: employee.is_admin,
      parent_employee_id: employee.parent_employee_id,
    })
    setIsEditing(true)
  }

  const handleSubmit = async () => {
    const updateData = {
      ...employeeData,
      spending_limit: parseFloat(employeeData.spending_limit),
    }

    setIsSaving(true)
    const { error } = await updateEmployee(updateData as StoreUpdateEmployee)
    setIsSaving(false)

    if (error) {
      toast.error(error)
      return
    }

    setIsEditing(false)
    toast.success("Employee updated")
  }

  const spent = getOrderTotalInSpendWindow(orders, getSpendWindow(company)) || 0
  const amountSpent = formatAmount(spent, company.currency_code!)

  return (
    <div className="flex flex-col">
      <div className="flex justify-between gap-2 p-4 border-b border-neutral-200">
        <div
          className="flex items-start gap-2 min-w-0"
          style={{ paddingLeft: depth * 24 }}
        >
          <TreeToggle
            hasChildren={childCount > 0}
            isCollapsed={isCollapsed}
            onToggle={onToggle}
          />
          <div className="flex flex-col min-w-0">
            <Text className=" text-neutral-950 font-medium">
              {employee.customer.first_name} {employee.customer.last_name}{" "}
              {isCurrentUser && "(You)"}{" "}
              {employee.is_owner ? (
                <>
                  {" • "}
                  <span className="text-blue-500">Owner</span>
                </>
              ) : (
                employee.is_admin && (
                  <>
                    {" • "}
                    <span className="text-blue-500">Admin</span>
                  </>
                )
              )}
              {isCollapsed && childCount > 0 && (
                <span className="text-neutral-500 font-normal">
                  {" "}
                  (+{childCount})
                </span>
              )}
            </Text>
            <div className="flex gap-x-2 small:flex-row flex-col">
              <Text className=" text-neutral-500">
                {employee.customer.email}
              </Text>
              <Text className=" text-neutral-500 hidden small:block">
                {" • "}
              </Text>
              <Text className=" text-neutral-500">
                {employee.customer.phone}
              </Text>
              <Text className=" text-neutral-500 hidden small:block">
                {" • "}
              </Text>
              <Text className=" text-neutral-500">
                {amountSpent} /{" "}
                {employee.spending_limit > 0
                  ? formatAmount(
                      employee.spending_limit,
                      company.currency_code!
                    )
                  : "No limit"}{" "}
                spent
              </Text>
            </div>
          </div>
        </div>
        {isViewerAdmin && (
          <div className="flex items-center justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSaving}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="transparent"
                  onClick={() => onInviteUnder(employee)}
                >
                  Invite under
                </Button>
                {canManage && (
                  <>
                    {canMakeOwner && (
                      <TransferOwnershipPrompt employee={employee} />
                    )}
                    {canRemove && (
                      <RemoveEmployeePrompt
                        employee={employee}
                        childrenDestination={childrenDestination}
                      />
                    )}
                    <Button variant="secondary" onClick={startEditing}>
                      Edit
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <form
        className={clx(
          "bg-neutral-50 grid small:grid-cols-3 grid-cols-1 gap-4 border-b border-neutral-200 transition-all duration-300 ease-in-out",
          {
            "max-h-[260px] small:max-h-[98px] opacity-100 p-4": isEditing,
            "max-h-0 h-0 opacity-0 border-b-0": !isEditing,
          }
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            handleSubmit()
          }
        }}
      >
        <div className="flex flex-col gap-y-2">
          <Text className=" text-neutral-950 font-medium">Spending Limit</Text>
          <CurrencyInput
            symbol={currencySymbolMap[company.currency_code!]}
            code={company.currency_code!}
            className="bg-white rounded-full"
            name="spending_limit"
            value={employeeData.spending_limit}
            onChange={(e) => {
              setEmployeeData({
                ...employeeData,
                spending_limit: e.target.value.replace(/[^0-9.]/g, ""),
              })
            }}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Text className=" text-neutral-950 font-medium">Permissions</Text>
          <NativeSelect
            className="bg-white"
            name="permissions"
            value={employeeData.is_admin ? "true" : "false"}
            // The owner is always an admin
            disabled={!customer?.employee?.is_admin || employee.is_owner}
            onChange={(e) => {
              setEmployeeData({
                ...employeeData,
                is_admin: e.target.value === "true",
              })
            }}
          >
            <option value="true">Admin</option>
            <option value="false">Employee</option>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-y-2">
          <Text className=" text-neutral-950 font-medium">Place under</Text>
          <PlaceUnderSelect
            className="bg-white"
            employees={employees}
            excludeEmployeeId={employee.id}
            value={employeeData.parent_employee_id}
            onChange={(parent_employee_id) =>
              setEmployeeData({ ...employeeData, parent_employee_id })
            }
          />
        </div>
      </form>
    </div>
  )
}

export default Employee
