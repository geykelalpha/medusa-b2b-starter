"use client"

import { createMyCompany } from "@/lib/data/companies"
import {
  CompanyFieldName,
  CompanyFieldValues,
  emptyCompanyFieldValues,
  isCompanyFieldValuesValid,
} from "@/lib/util/company-form"
import CompanyFields from "@/modules/account/components/company-fields"
import ErrorMessage from "@/modules/checkout/components/error-message"
import { SubmitButton } from "@/modules/checkout/components/submit-button"
import { HttpTypes } from "@medusajs/types"
import { Container, Text } from "@medusajs/ui"
import { useActionState, useState } from "react"

type Props = {
  regions: HttpTypes.StoreRegion[]
  /** Set when signup created the account but not the company. */
  signupFailed?: boolean
}

/**
 * Shown on the company page to customers that don't belong to a company.
 * They can create one (and become its admin) or join one through an invite.
 */
const NoCompanyCard = ({ regions, signupFailed }: Props) => {
  const [state, formAction] = useActionState(createMyCompany, {
    error: null,
  })
  const [values, setValues] = useState<CompanyFieldValues>(
    emptyCompanyFieldValues
  )

  const handleChange = (name: CompanyFieldName, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex flex-col gap-y-4" data-testid="no-company-card">
      {signupFailed && (
        <Text className="text-rose-500 text-small-regular">
          Your account was created, but we couldn&apos;t create your company.
          Please try again below.
        </Text>
      )}
      <Container className="p-0 overflow-hidden">
        <div className="flex flex-col gap-y-1 border-b border-neutral-200 p-4">
          <Text className="font-medium text-neutral-950">
            You&apos;re not part of a company yet
          </Text>
          <Text className="text-neutral-500 text-small-regular">
            Create a company to manage employees, spending limits and
            approvals, and to request quotes. To join an existing company,
            ask one of its admins to invite you, then use the link in the
            invite email.
          </Text>
        </div>
        <form action={formAction}>
          <div className="flex flex-col gap-y-4 p-4">
            <CompanyFields
              values={values}
              onChange={handleChange}
              regions={regions}
            />
            <ErrorMessage
              error={state.error}
              data-testid="create-company-error"
            />
          </div>
          <div className="flex items-center justify-end gap-2 bg-neutral-50 p-4">
            <SubmitButton
              data-testid="create-company-button"
              disabled={!isCompanyFieldValuesValid(values)}
            >
              Create company
            </SubmitButton>
          </div>
        </form>
      </Container>
    </div>
  )
}

export default NoCompanyCard
