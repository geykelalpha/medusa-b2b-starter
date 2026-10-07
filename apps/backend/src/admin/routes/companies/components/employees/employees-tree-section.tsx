import {
  ExclamationCircle,
  TriangleDownMini,
  TriangleRightMini,
} from "@medusajs/icons";
import {
  Avatar,
  Badge,
  Button,
  Container,
  Heading,
  IconButton,
  Table,
  Text,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QueryCompany, QueryEmployee } from "../../../../../types";
import { useEmployeeInvites } from "../../../../hooks/api";
import {
  buildEmployeeTree,
  EmployeeTreeNode,
  flattenEmployeeTree,
} from "../../../../lib/employee-tree";
import { formatAmount } from "../../../../utils";
import { EmployeeAddExistingDrawer } from "./employees-add-existing-drawer";
import { EmployeesActionsMenu } from "./employees-actions-menu";
import { EmployeeCreateDrawer } from "./employees-create-drawer";
import { EmployeeInviteActionsMenu } from "./employee-invite-actions-menu";

const INDENT_PX = 24;

type DrawerState = { open: boolean; parentId: string | null };

const closed: DrawerState = { open: false, parentId: null };

/**
 * The company's employees as a collapsible tree, with pending invites shown
 * under the employee they'll be placed under.
 */
export const EmployeesTreeSection = ({
  company,
}: {
  company: QueryCompany;
}) => {
  const navigate = useNavigate();
  const { data: invitesData } = useEmployeeInvites(company.id, {
    status: "pending",
  });

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [invite, setInvite] = useState<DrawerState>(closed);
  const [addExisting, setAddExisting] = useState<DrawerState>(closed);

  const employees = useMemo(() => company.employees ?? [], [company.employees]);
  const invites = useMemo(() => invitesData?.invites ?? [], [invitesData]);

  const rows = useMemo(
    () => flattenEmployeeTree(buildEmployeeTree(employees, invites), collapsed),
    [employees, invites, collapsed]
  );

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const currencyCode = company.currency_code || "USD";

  const renderName = (node: EmployeeTreeNode) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);

    return (
      <div
        className="flex items-center gap-2"
        style={{ paddingLeft: node.depth * INDENT_PX }}
      >
        {hasChildren ? (
          <IconButton
            size="2xsmall"
            variant="transparent"
            onClick={(e) => {
              e.stopPropagation();
              toggle(node.id);
            }}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <TriangleRightMini /> : <TriangleDownMini />}
          </IconButton>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        {node.kind === "employee" ? (
          <>
            <Avatar
              size="xsmall"
              fallback={node.employee.customer?.first_name?.charAt(0) || ""}
            />
            <Text size="small" leading="compact" weight="plus">
              {[
                node.employee.customer?.first_name,
                node.employee.customer?.last_name,
              ]
                .filter(Boolean)
                .join(" ") || "-"}
            </Text>
            {node.employee.is_owner && (
              <Badge size="2xsmall" color="blue">
                Owner
              </Badge>
            )}
            {node.employee.is_admin && (
              <Badge size="2xsmall" color="green">
                Admin
              </Badge>
            )}
          </>
        ) : (
          <>
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-muted italic"
            >
              {[node.invite.first_name, node.invite.last_name]
                .filter(Boolean)
                .join(" ") || "Pending invite"}
            </Text>
            {new Date(node.invite.expires_at) <= new Date() ? (
              <Badge size="2xsmall" color="red">
                Invite expired
              </Badge>
            ) : (
              <Badge size="2xsmall" color="orange">
                Invited · expires{" "}
                {new Date(node.invite.expires_at).toLocaleDateString()}
              </Badge>
            )}
            {node.invite.is_admin && (
              <Badge size="2xsmall" color="green">
                Admin
              </Badge>
            )}
          </>
        )}
        {hasChildren && isCollapsed && (
          <Text size="xsmall" className="text-ui-fg-subtle">
            +{node.children.length}
          </Text>
        )}
      </div>
    );
  };

  const openInvite = (parent: QueryEmployee | null) =>
    setInvite({ open: true, parentId: parent?.id ?? null });

  const openAddExisting = (parent: QueryEmployee | null) =>
    setAddExisting({ open: true, parentId: parent?.id ?? null });

  return (
    <Container className="flex flex-col p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 justify-between border-b border-ui-border-base">
        <div className="flex flex-col">
          <Heading className="font-sans font-medium h1-core">Employees</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Use an employee's menu to invite or add someone under them, or to
            move them.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => openAddExisting(null)}
          >
            Add existing customer
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => openInvite(null)}
          >
            Invite
          </Button>
        </div>
      </div>
      {rows.length > 0 ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Spending Limit</Table.HeaderCell>
              <Table.HeaderCell className="w-12" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((node) =>
              node.kind === "employee" ? (
                <Table.Row
                  key={node.id}
                  onClick={() =>
                    navigate(`/customers/${node.employee.customer?.id}`)
                  }
                  className="cursor-pointer"
                >
                  <Table.Cell>{renderName(node)}</Table.Cell>
                  <Table.Cell>{node.employee.customer?.email}</Table.Cell>
                  <Table.Cell>
                    {formatAmount(node.employee.spending_limit, currencyCode)}
                  </Table.Cell>
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <EmployeesActionsMenu
                      company={company}
                      employee={node.employee}
                      onInviteUnder={openInvite}
                      onAddExistingUnder={openAddExisting}
                    />
                  </Table.Cell>
                </Table.Row>
              ) : (
                <Table.Row key={node.id} className="bg-ui-bg-subtle">
                  <Table.Cell>{renderName(node)}</Table.Cell>
                  <Table.Cell className="text-ui-fg-muted">
                    {node.invite.email}
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-muted">
                    {formatAmount(node.invite.spending_limit, currencyCode)}
                  </Table.Cell>
                  <Table.Cell>
                    <EmployeeInviteActionsMenu
                      company={company}
                      invite={node.invite}
                    />
                  </Table.Cell>
                </Table.Row>
              )
            )}
          </Table.Body>
        </Table>
      ) : (
        <div className="flex h-[400px] w-full flex-col items-center justify-center gap-y-4">
          <div className="flex flex-col items-center gap-y-3">
            <ExclamationCircle />
            <div className="flex flex-col items-center gap-y-1">
              <Text className="font-medium font-sans txt-compact-small">
                No records
              </Text>
              <Text className="txt-small text-ui-fg-muted">
                This company doesn't have any employees yet. Invite one or add
                an existing customer to get started.
              </Text>
            </div>
          </div>
        </div>
      )}
      <EmployeeCreateDrawer
        company={company}
        open={invite.open}
        onOpenChange={(open) => setInvite((s) => ({ ...s, open }))}
        defaultParentId={invite.parentId}
      />
      <EmployeeAddExistingDrawer
        company={company}
        open={addExisting.open}
        onOpenChange={(open) => setAddExisting((s) => ({ ...s, open }))}
        defaultParentId={addExisting.parentId}
      />
    </Container>
  );
};
