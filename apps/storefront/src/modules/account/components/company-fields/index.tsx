"use client"

import { currencySymbolMap } from "@/lib/constants"
import {
  CompanyFieldName,
  CompanyFieldValues,
} from "@/lib/util/company-form"
import Input from "@/modules/common/components/input"
import { HttpTypes } from "@medusajs/types"
import { Select } from "@medusajs/ui"
import { ChangeEvent } from "react"

type Props = {
  values: CompanyFieldValues
  onChange: (name: CompanyFieldName, value: string) => void
  regions: HttpTypes.StoreRegion[]
}

const placeholder = ({
  placeholder,
  required,
}: {
  placeholder: string
  required: boolean
}) => {
  return (
    <span className="text-ui-fg-muted">
      {placeholder}
      {required && <span className="text-ui-fg-error">*</span>}
    </span>
  )
}

/**
 * The company inputs shared by the signup form and the "create a company"
 * form in the account area.
 */
const CompanyFields = ({ values, onChange, regions }: Props) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.name as CompanyFieldName, e.target.value)

  const countryNames = regions
    .flatMap((region) =>
      region.countries?.map((country) => country?.display_name || country?.name)
    )
    .filter((country) => country !== undefined)

  const currencies = regions.map((region) => region.currency_code)

  return (
    <>
      <Input
        label="Company name"
        name="company_name"
        required
        autoComplete="organization"
        data-testid="company-name-input"
        className="bg-white"
        value={values.company_name}
        onChange={handleChange}
      />
      <Input
        label="Company address"
        name="company_address"
        required
        autoComplete="address"
        data-testid="company-address-input"
        className="bg-white"
        value={values.company_address}
        onChange={handleChange}
      />
      <Input
        label="Company city"
        name="company_city"
        required
        autoComplete="city"
        data-testid="company-city-input"
        className="bg-white"
        value={values.company_city}
        onChange={handleChange}
      />
      <Input
        label="Company state"
        name="company_state"
        autoComplete="state"
        data-testid="company-state-input"
        className="bg-white"
        value={values.company_state}
        onChange={handleChange}
      />
      <Input
        label="Company zip"
        name="company_zip"
        required
        autoComplete="postal-code"
        data-testid="company-zip-input"
        className="bg-white"
        value={values.company_zip}
        onChange={handleChange}
      />
      <Select
        name="company_country"
        required
        autoComplete="country"
        data-testid="company-country-input"
        value={values.company_country}
        onValueChange={(value) => onChange("company_country", value)}
      >
        <Select.Trigger className="rounded-full h-10 px-4">
          <Select.Value
            placeholder={placeholder({
              placeholder: "Select a country",
              required: true,
            })}
          />
        </Select.Trigger>
        <Select.Content>
          {countryNames?.map((country) => (
            <Select.Item key={country} value={country}>
              {country}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      <Select
        name="currency_code"
        required
        autoComplete="currency"
        data-testid="company-currency-input"
        value={values.currency_code}
        onValueChange={(value) => onChange("currency_code", value)}
      >
        <Select.Trigger className="rounded-full h-10 px-4">
          <Select.Value
            placeholder={placeholder({
              placeholder: "Select a currency",
              required: true,
            })}
          />
        </Select.Trigger>
        <Select.Content>
          {[...new Set(currencies)].map((currency) => (
            <Select.Item key={currency} value={currency}>
              {currency.toUpperCase()} ({currencySymbolMap[currency]})
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </>
  )
}

export default CompanyFields
