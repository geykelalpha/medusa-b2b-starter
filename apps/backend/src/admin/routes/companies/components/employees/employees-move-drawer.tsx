import { Button, Drawer, Text, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { QueryCompany, QueryEmployee } from "../../../../../types";
import { useUpdateEmployee } from "../../../../hooks/api";
import { employeeName } from "../../../../lib/employee-tree";
import { EmployeeParentSelect } from "./employee-parent-select";

/** Moves an employee (with everyone under it) to another parent. */
export function EmployeesMoveDrawer({
  company,
  employee,
  open,
  setOpen,
}: {
  company: QueryCompany;
  employee: QueryEmployee;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [parentId, setParentId] = useState<string | null>(
    employee.parent_employee_id
  );

  const {
    mutateAsync: updateEmployee,
    isPending,
    error,
    reset,
  } = useUpdateEmployee(company.id, employee.id);

  // Start from the current parent every time the drawer opens
  useEffect(() => {
    if (open) {
      setParentId(employee.parent_employee_id);
      reset();
    }
  }, [open, employee.parent_employee_id, reset]);

  const onOpenChange = (value: boolean) => setOpen(value);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateEmployee({ parent_employee_id: parentId });
    } catch {
      // The error is surfaced through `error`
      return;
    }

    toast.success(`${employeeName(employee)} was moved`);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Move {employeeName(employee)}</Drawer.Title>
        </Drawer.Header>
        <form onSubmit={onSubmit} className="flex flex-1 flex-col">
          <Drawer.Body className="flex flex-col p-4 gap-6">
            <Text size="small" className="text-ui-fg-subtle">
              Everyone under {employeeName(employee)} moves along with them.
            </Text>
            <EmployeeParentSelect
              employees={company.employees ?? []}
              value={parentId}
              onChange={setParentId}
              excludeEmployeeId={employee.id}
            />
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary" size="small">
                Cancel
              </Button>
            </Drawer.Close>
            <Button
              type="submit"
              size="small"
              disabled={
                isPending || parentId === employee.parent_employee_id
              }
              isLoading={isPending}
            >
              Move
            </Button>
            {error && <Text className="text-red-500">{error.message}</Text>}
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
}
