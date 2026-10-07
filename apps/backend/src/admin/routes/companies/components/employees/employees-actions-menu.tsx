import {
  ArrowLongRight,
  ArrowRightOnRectangle,
  EllipsisHorizontal,
  Envelope,
  PencilSquare,
  Trash,
  User,
} from "@medusajs/icons";
import { Button, DropdownMenu, IconButton, Prompt, toast } from "@medusajs/ui";
import { useState } from "react";
import { EmployeesUpdateDrawer } from "./employees-update-drawer";
import { EmployeesMoveDrawer } from "./employees-move-drawer";
import { QueryCompany, QueryEmployee } from "../../../../../types";
import { DeletePrompt } from "../../../../components/common";
import {
  useDeleteEmployee,
  useTransferCompanyOwnership,
} from "../../../../hooks/api";
import { employeeName } from "../../../../lib/employee-tree";

export const EmployeesActionsMenu = ({
  company,
  employee,
  onInviteUnder,
  onAddExistingUnder,
}: {
  company: QueryCompany;
  employee: QueryEmployee;
  onInviteUnder: (employee: QueryEmployee) => void;
  onAddExistingUnder: (employee: QueryEmployee) => void;
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const { mutateAsync: mutateDelete, isPending: loadingDelete } =
    useDeleteEmployee(employee.company_id);
  const { mutateAsync: mutateTransfer, isPending: loadingTransfer } =
    useTransferCompanyOwnership(company.id);

  const canTransfer = employee.is_admin && !employee.is_owner;

  // Removing an employee moves everyone directly under it up a level
  const parent = company.employees?.find(
    (e) => e.id === employee.parent_employee_id
  );
  const hasChildren = !!company.employees?.some(
    (e) => e.parent_employee_id === employee.id
  );
  const deleteDescription = hasChildren
    ? `Remove ${employeeName(employee)} from ${company.name}? Everyone under them will be moved ${
        parent ? `under ${employeeName(parent)}` : "to the top level"
      }.`
    : `Remove ${employeeName(employee)} from ${company.name}?`;

  const handleTransfer = async () => {
    try {
      await mutateTransfer(employee.id);
    } catch (error) {
      toast.error((error as Error).message);
      return;
    }

    setTransferOpen(false);
    toast.success(`${employee.customer?.email} is now the company owner`);
  };

  const handleDelete = async () => {
    await mutateDelete(employee.id, {
      onSuccess: () => {
        toast.success(`Employee deleted successfully`);
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <IconButton variant="transparent">
            <EllipsisHorizontal />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item
            className="gap-x-2"
            onClick={() => setEditOpen(true)}
          >
            <PencilSquare />
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="gap-x-2"
            onClick={() => setMoveOpen(true)}
          >
            <ArrowLongRight />
            Move to…
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            className="gap-x-2"
            onClick={() => onInviteUnder(employee)}
          >
            <Envelope />
            Invite under
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="gap-x-2"
            onClick={() => onAddExistingUnder(employee)}
          >
            <User />
            Add existing customer under
          </DropdownMenu.Item>
          {canTransfer && (
            <>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
              className="gap-x-2"
              onClick={() => setTransferOpen(true)}
            >
                <ArrowRightOnRectangle />
                Make owner
              </DropdownMenu.Item>
            </>
          )}
          {/* The owner can't be removed until ownership is transferred */}
          {!employee.is_owner && (
            <>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                className="gap-x-2"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash />
                Delete
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu>
      <EmployeesUpdateDrawer
        company={company}
        employee={employee}
        open={editOpen}
        setOpen={setEditOpen}
        toast={toast}
      />
      <EmployeesMoveDrawer
        company={company}
        employee={employee}
        open={moveOpen}
        setOpen={setMoveOpen}
      />
      <Prompt open={transferOpen} onOpenChange={setTransferOpen}>
        <Prompt.Content className="p-4 pb-0 border-b shadow-ui-fg-shadow">
          <Prompt.Title>Transfer Ownership</Prompt.Title>
          <Prompt.Description>
            Make {employee.customer?.email} the owner of {company.name}? The
            current owner stays an admin.
          </Prompt.Description>
          <Prompt.Footer>
            <Button onClick={handleTransfer} isLoading={loadingTransfer}>
              Make owner
            </Button>
            <Button variant="secondary" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
      <DeletePrompt
        handleDelete={handleDelete}
        loading={loadingDelete}
        open={deleteOpen}
        setOpen={setDeleteOpen}
        description={deleteDescription}
      />
    </>
  );
};
