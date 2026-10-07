"use client"

import { getParentOptions } from "@/lib/util/employee-tree"
import NativeSelect from "@/modules/common/components/native-select"
import { QueryEmployee } from "@/types"
import { useMemo } from "react"

// NativeSelect reserves "" for its placeholder, so the top level gets its own value
const TOP_LEVEL = "top_level"

/**
 * Picks where an employee sits in the company's tree. `null` is the top
 * level. Pass `excludeEmployeeId` when moving an existing employee, so it
 * can't be placed under itself or its descendants.
 */
const PlaceUnderSelect = ({
  employees,
  value,
  onChange,
  excludeEmployeeId,
  className,
  disabled,
}: {
  employees: QueryEmployee[]
  value: string | null
  onChange: (value: string | null) => void
  excludeEmployeeId?: string
  className?: string
  disabled?: boolean
}) => {
  const options = useMemo(
    () => getParentOptions(employees, excludeEmployeeId),
    [employees, excludeEmployeeId]
  )

  return (
    <NativeSelect
      className={className}
      name="parent_employee_id"
      value={value ?? TOP_LEVEL}
      disabled={disabled}
      onChange={(e) =>
        onChange(e.target.value === TOP_LEVEL ? null : e.target.value)
      }
    >
      <option value={TOP_LEVEL}>Top level</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {"   ".repeat(option.depth)}
          {option.label}
        </option>
      ))}
    </NativeSelect>
  )
}

export default PlaceUnderSelect
