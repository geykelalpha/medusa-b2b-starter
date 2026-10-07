import { ArrowPath, EllipsisHorizontal, XCircle } from "@medusajs/icons";
import { DropdownMenu, IconButton, toast, usePrompt } from "@medusajs/ui";
import { QueryCompany, QueryEmployeeInvite } from "../../../../../types";
import {
  useResendEmployeeInvite,
  useRevokeEmployeeInvite,
} from "../../../../hooks/api";

export const EmployeeInviteActionsMenu = ({
  company,
  invite,
}: {
  company: QueryCompany;
  invite: QueryEmployeeInvite;
}) => {
  const prompt = usePrompt();
  const { mutateAsync: resend, isPending: resending } =
    useResendEmployeeInvite(company.id);
  const { mutateAsync: revoke, isPending: revoking } = useRevokeEmployeeInvite(
    company.id
  );

  const handleResend = async () => {
    try {
      await resend(invite.id);
      toast.success(`Invite resent to ${invite.email}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleRevoke = async () => {
    const confirmed = await prompt({
      title: "Revoke invite",
      description: `${invite.email} will no longer be able to use this invite to join ${company.name}.`,
      confirmText: "Revoke",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    try {
      await revoke(invite.id);
      toast.success(`Invite for ${invite.email} revoked`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton variant="transparent" disabled={resending || revoking}>
          <EllipsisHorizontal />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item className="gap-x-2" onClick={handleResend}>
          <ArrowPath />
          Resend
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item className="gap-x-2" onClick={handleRevoke}>
          <XCircle />
          Revoke
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};
