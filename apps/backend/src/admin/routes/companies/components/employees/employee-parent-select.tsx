import { Label, Select, Text } from "@medusajs/ui";
import { useMemo } from "react";
import { QueryEmployee } from "../../../../../types";
import { getParentOptions } from "../../../../lib/employee-tree";

// Radix Select doesn't allow an empty value, so the top level gets a sentinel
const TOP_LEVEL = "__top_level__";

/**
 * Picks where an employee sits in the company's tree. `null` is the top
 * level. Pass `excludeEmployeeId` when moving an existing employee, so it
 * can't be placed under itself or its descendants.
 */
export const EmployeeParentSelect = ({
  employees,
  value,
  onChange,
  excludeEmployeeId,
}: {
  employees: QueryEmployee[];
  value: string | null;
  onChange: (value: string | null) => void;
  excludeEmployeeId?: string;
}) => {
  const options = useMemo(
    () => getParentOptions(employees, excludeEmployeeId),
    [employees, excludeEmployeeId]
  );

  return (
    <div className="flex flex-col gap-2">
      <Label size="xsmall" className="txt-compact-small font-medium">
        Place under
      </Label>
      <Select
        value={value ?? TOP_LEVEL}
        onValueChange={(next) => onChange(next === TOP_LEVEL ? null : next)}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value={TOP_LEVEL}>Top level</Select.Item>
          {options.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              <span style={{ paddingLeft: option.depth * 12 }}>
                {option.label}
              </span>
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        Leave at top level, or pick the employee this one sits under.
      </Text>
    </div>
  );
};
