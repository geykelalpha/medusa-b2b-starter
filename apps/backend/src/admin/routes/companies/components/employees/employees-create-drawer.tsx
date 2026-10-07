import { Drawer, toast } from "@medusajs/ui";
import { AdminCreateEmployeeInvite, QueryCompany } from "../../../../../types";
import { useCreateEmployeeInvite } from "../../../../hooks/api";
import { EmployeesCreateForm } from "./employees-create-form";

/**
 * Invites a new employee. Opened from the employees section, either at the
 * top level or under a given employee (`defaultParentId`).
 */
export function EmployeeCreateDrawer({
  company,
  open,
  onOpenChange,
  defaultParentId = null,
}: {
  company: QueryCompany;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultParentId?: string | null;
}) {
  const {
    mutateAsync: createInvite,
    isPending: loading,
    error,
    reset,
  } = useCreateEmployeeInvite(company.id);

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      reset();
    }
  };

  const handleSubmit = async (formData: AdminCreateEmployeeInvite) => {
    const { invite } = await createInvite(formData);

    handleOpenChange(false);
    toast.success(`Invite sent to ${invite.email}`);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Invite Employee</Drawer.Title>
        </Drawer.Header>
        {/* Remount on every open so the form starts empty */}
        {open && (
          <EmployeesCreateForm
            handleSubmit={handleSubmit}
            loading={loading}
            error={error}
            company={company}
            defaultParentId={defaultParentId}
          />
        )}
      </Drawer.Content>
    </Drawer>
  );
}
