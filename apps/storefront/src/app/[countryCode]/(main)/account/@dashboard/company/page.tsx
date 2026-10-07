import { retrieveCompany } from "@/lib/data/companies"
import { retrieveCustomer } from "@/lib/data/customer"
import { listInvites } from "@/lib/data/invites"
import { listRegions } from "@/lib/data/regions"
import ApprovalSettingsCard from "@/modules/account/components/approval-settings-card"
import CompanyCard from "@/modules/account/components/company-card"
import EmployeesCard from "@/modules/account/components/employees-card"
import NoCompanyCard from "@/modules/account/components/no-company-card"
import { Heading } from "@medusajs/ui"
import { notFound } from "next/navigation"

export default async function Company({
  searchParams,
}: {
  searchParams: Promise<{ company_error?: string }>
}) {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer) return notFound()

  const employee = customer.employee

  if (!employee?.company_id) {
    const { company_error } = await searchParams

    return (
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-y-4">
          <Heading level="h2" className="text-lg text-neutral-950">
            Company
          </Heading>
          <NoCompanyCard regions={regions} signupFailed={!!company_error} />
        </div>
      </div>
    )
  }

  const isAdmin = employee.is_admin

  const [company, invites] = await Promise.all([
    retrieveCompany(employee.company_id),
    isAdmin ? listInvites(employee.company_id) : [],
  ])

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Company Details
        </Heading>
        <CompanyCard company={company} regions={regions} canEdit={isAdmin} />
      </div>
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Approval Settings
        </Heading>
        <ApprovalSettingsCard company={company} customer={customer} />
      </div>
      <EmployeesCard company={company} invites={invites} />
    </div>
  )
}
