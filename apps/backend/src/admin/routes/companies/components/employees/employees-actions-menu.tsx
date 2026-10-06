import {
  ArrowRightOnRectangle,
  EllipsisHorizontal,
  PencilSquare,
  Trash,
} from "@medusajs/icons";
import { Button, DropdownMenu, IconButton, Prompt, toast } from "@medusajs/ui";
import { useState } from "react";
import { EmployeesUpdateDrawer } from ".";
import { QueryCompany, QueryEmployee } from "../../../../../types";
import { DeletePrompt } from "../../../../components/common";
import {
  useDeleteEmployee,
  useTransferCompanyOwnership,
} from "../../../../hooks/api";

export const EmployeesActionsMenu = ({
  company,
  employee,
}: {
  company: QueryCompany;
  employee: QueryEmployee;
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const { mutateAsync: mutateDelete, isPending: loadingDelete } =
    useDeleteEmployee(employee.company_id);
  const { mutateAsync: mutateTransfer, isPending: loadingTransfer } =
    useTransferCompanyOwnership(company.id);

  const canTransfer = employee.is_admin && !employee.is_owner;

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
          {canTransfer && (
            <DropdownMenu.Item
              className="gap-x-2"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowRightOnRectangle />
              Make owner
            </DropdownMenu.Item>
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
      />
    </>
  );
};
