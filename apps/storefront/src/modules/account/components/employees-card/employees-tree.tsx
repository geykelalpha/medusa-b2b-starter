"use client"

import {
  buildEmployeeTree,
  employeeName,
  flattenEmployeeTree,
} from "@/lib/util/employee-tree"
import Employee from "@/modules/account/components/employees-card/employee"
import PendingInvite from "@/modules/account/components/employees-card/pending-invite"
import InviteEmployeeCard from "@/modules/account/components/invite-employee-card"
import {
  B2BCustomer,
  ModuleEmployeeInvite,
  QueryCompany,
  QueryEmployee,
} from "@/types"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { useMemo, useRef, useState } from "react"

/**
 * The company's employees as a collapsible tree, with pending invites under
 * the employee they'll be placed under, followed by the invite form for
 * admins.
 */
const EmployeesTree = ({
  company,
  invites,
  customer,
  orders,
}: {
  company: QueryCompany
  invites: ModuleEmployeeInvite[]
  customer: B2BCustomer | null
  orders: HttpTypes.StoreOrder[]
}) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [inviteParentId, setInviteParentId] = useState<string | null>(null)
  const inviteRef = useRef<HTMLDivElement>(null)

  const isAdmin = !!customer?.employee?.is_admin
  const employees = useMemo(() => company.employees ?? [], [company.employees])

  const tree = useMemo(
    () => buildEmployeeTree(employees, invites, customer?.employee?.id),
    [employees, invites, customer?.employee?.id]
  )
  const rows = useMemo(
    () => flattenEmployeeTree(tree, collapsed),
    [tree, collapsed]
  )

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const inviteUnder = (employee: QueryEmployee) => {
    setInviteParentId(employee.id)
    inviteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    toast(`Inviting under ${employeeName(employee)}`)
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Employees
        </Heading>
        <Container className="p-0 overflow-hidden">
          <div className="flex flex-col">
            {rows.map((node) =>
              node.kind === "employee" ? (
                <Employee
                  key={node.id}
                  employee={node.employee}
                  company={company}
                  orders={orders}
                  customer={customer}
                  depth={node.depth}
                  childCount={node.children.length}
                  isCollapsed={collapsed.has(node.id)}
                  onToggle={() => toggle(node.id)}
                  onInviteUnder={inviteUnder}
                />
              ) : (
                <PendingInvite
                  key={node.id}
                  invite={node.invite}
                  companyId={company.id}
                  depth={node.depth}
                />
              )
            )}
          </div>
        </Container>
        {isAdmin && (
          <Text className="text-neutral-500 text-sm">
            Use &quot;Invite under&quot; to invite someone below an employee, or
            &quot;Edit&quot; to move an employee (with everyone under them).
          </Text>
        )}
      </div>
      {isAdmin && (
        <div ref={inviteRef} className="mb-8 flex flex-col gap-y-4">
          <Heading level="h2" className="text-lg text-neutral-950">
            Invite Employees
          </Heading>
          <InviteEmployeeCard
            company={company}
            parentId={inviteParentId}
            onParentChange={setInviteParentId}
          />
        </div>
      )}
    </>
  )
}

export default EmployeesTree
