import { Button, Drawer, toast } from "@medusajs/ui";
import { useState } from "react";
import { AdminCreateEmployeeInvite, QueryCompany } from "../../../../../types";
import { useCreateEmployeeInvite } from "../../../../hooks/api";
import { EmployeesCreateForm } from "./employees-create-form";

export function EmployeeCreateDrawer({ company }: { company: QueryCompany }) {
  const [open, setOpen] = useState(false);

  const {
    mutateAsync: createInvite,
    isPending: loading,
    error,
  } = useCreateEmployeeInvite(company.id);

  const handleSubmit = async (formData: AdminCreateEmployeeInvite) => {
    const { invite } = await createInvite(formData);

    setOpen(false);
    toast.success(`Invite sent to ${invite.email}`);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button variant="secondary" size="small">
          Invite
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Invite Employee</Drawer.Title>
        </Drawer.Header>
        <EmployeesCreateForm
          handleSubmit={handleSubmit}
          loading={loading}
          error={error}
          company={company}
        />
      </Drawer.Content>
    </Drawer>
  );
}
