import { ArrowPath, EllipsisHorizontal, XCircle } from "@medusajs/icons";
import {
  Badge,
  Container,
  DropdownMenu,
  Heading,
  IconButton,
  Table,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui";
import { QueryCompany, QueryEmployeeInvite } from "../../../../../types";
import {
  useEmployeeInvites,
  useResendEmployeeInvite,
  useRevokeEmployeeInvite,
} from "../../../../hooks/api";
import { formatAmount } from "../../../../utils";

const EmployeeInviteActionsMenu = ({
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

export const EmployeeInvitesSection = ({
  company,
}: {
  company: QueryCompany;
}) => {
  const { data } = useEmployeeInvites(company.id, { status: "pending" });

  const invites = data?.invites ?? [];

  if (!invites.length) {
    return null;
  }

  return (
    <Container className="flex flex-col p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 justify-between border-b border-gray-200">
        <Heading className="font-sans font-medium h1-core">
          Pending Invites
        </Heading>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Spending Limit</Table.HeaderCell>
            <Table.HeaderCell>Expires</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {invites.map((invite) => {
            const expired = new Date(invite.expires_at) <= new Date();
            const name = [invite.first_name, invite.last_name]
              .filter(Boolean)
              .join(" ");

            return (
              <Table.Row key={invite.id}>
                <Table.Cell className="flex w-fit gap-2 items-center">
                  {name || "-"}
                  {invite.is_admin && (
                    <Badge size="2xsmall" color="green">
                      Admin
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell>{invite.email}</Table.Cell>
                <Table.Cell>
                  {formatAmount(
                    invite.spending_limit,
                    company.currency_code || "USD"
                  )}
                </Table.Cell>
                <Table.Cell>
                  {expired ? (
                    <Badge size="2xsmall" color="red">
                      Expired
                    </Badge>
                  ) : (
                    <Text size="small" className="text-ui-fg-subtle">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <EmployeeInviteActionsMenu
                    company={company}
                    invite={invite}
                  />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Container>
  );
};
