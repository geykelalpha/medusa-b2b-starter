import { QueryEmployee, QueryEmployeeInvite } from "../../types";

export type EmployeeTreeNode =
  | {
      kind: "employee";
      id: string;
      employee: QueryEmployee;
      depth: number;
      children: EmployeeTreeNode[];
    }
  | {
      kind: "invite";
      id: string;
      invite: QueryEmployeeInvite;
      depth: number;
      children: EmployeeTreeNode[];
    };

export const employeeName = (employee: QueryEmployee) =>
  [employee.customer?.first_name, employee.customer?.last_name]
    .filter(Boolean)
    .join(" ") ||
  employee.customer?.email ||
  employee.id;

const inviteName = (invite: QueryEmployeeInvite) =>
  [invite.first_name, invite.last_name].filter(Boolean).join(" ") ||
  invite.email;

// Owner first, then employees by name, then pending invites
const compareNodes = (a: EmployeeTreeNode, b: EmployeeTreeNode) => {
  if (a.kind !== b.kind) {
    return a.kind === "employee" ? -1 : 1;
  }

  if (a.kind === "employee" && b.kind === "employee") {
    if (a.employee.is_owner !== b.employee.is_owner) {
      return a.employee.is_owner ? -1 : 1;
    }
    return employeeName(a.employee).localeCompare(employeeName(b.employee));
  }

  if (a.kind === "invite" && b.kind === "invite") {
    return inviteName(a.invite).localeCompare(inviteName(b.invite));
  }

  return 0;
};

/**
 * Builds the company's employee tree. Pending invites hang under the
 * employee they'll be placed under. Unknown parents fall back to the top
 * level, so nothing is ever hidden.
 */
export const buildEmployeeTree = (
  employees: QueryEmployee[],
  invites: QueryEmployeeInvite[] = []
): EmployeeTreeNode[] => {
  const nodes = new Map<string, EmployeeTreeNode>();

  for (const employee of employees) {
    nodes.set(employee.id, {
      kind: "employee",
      id: employee.id,
      employee,
      depth: 0,
      children: [],
    });
  }

  const roots: EmployeeTreeNode[] = [];

  const attach = (node: EmployeeTreeNode, parentId: string | null) => {
    const parent = parentId ? nodes.get(parentId) : undefined;
    (parent && parent !== node ? parent.children : roots).push(node);
  };

  for (const employee of employees) {
    attach(nodes.get(employee.id)!, employee.parent_employee_id);
  }

  for (const invite of invites) {
    attach(
      { kind: "invite", id: invite.id, invite, depth: 0, children: [] },
      invite.parent_employee_id
    );
  }

  // Set depths and sort. Tracking visited nodes guards against bad data
  // (a cycle would otherwise never be reached from a root).
  const visited = new Set<string>();
  const walk = (list: EmployeeTreeNode[], depth: number) => {
    list.sort(compareNodes);
    for (const node of list) {
      visited.add(node.id);
      node.depth = depth;
      walk(node.children, depth + 1);
    }
  };
  walk(roots, 0);

  for (const node of nodes.values()) {
    if (!visited.has(node.id)) {
      node.children = [];
      roots.push(node);
      visited.add(node.id);
    }
  }

  return roots;
};

/** Depth-first list of the tree, skipping the children of collapsed nodes. */
export const flattenEmployeeTree = (
  tree: EmployeeTreeNode[],
  collapsed: Set<string> = new Set()
): EmployeeTreeNode[] =>
  tree.flatMap((node) => [
    node,
    ...(collapsed.has(node.id)
      ? []
      : flattenEmployeeTree(node.children, collapsed)),
  ]);

/** Ids of every employee below the given one. */
export const getDescendantIds = (
  employees: Pick<QueryEmployee, "id" | "parent_employee_id">[],
  employeeId: string
): Set<string> => {
  const descendants = new Set<string>();
  let frontier = [employeeId];

  while (frontier.length) {
    frontier = employees
      .filter(
        (employee) =>
          !!employee.parent_employee_id &&
          frontier.includes(employee.parent_employee_id) &&
          !descendants.has(employee.id)
      )
      .map((employee) => employee.id);
    frontier.forEach((id) => descendants.add(id));
  }

  return descendants;
};

export type ParentOption = { value: string; label: string; depth: number };

/**
 * Employees in tree order, for "Place under" pickers. When moving an
 * employee, pass it as `excludeId` so it and its descendants are left out.
 */
export const getParentOptions = (
  employees: QueryEmployee[],
  excludeId?: string
): ParentOption[] => {
  const excluded = excludeId
    ? new Set([excludeId, ...getDescendantIds(employees, excludeId)])
    : new Set<string>();

  return flattenEmployeeTree(buildEmployeeTree(employees))
    .filter(
      (node): node is Extract<EmployeeTreeNode, { kind: "employee" }> =>
        node.kind === "employee" && !excluded.has(node.id)
    )
    .map((node) => ({
      value: node.id,
      label: employeeName(node.employee),
      depth: node.depth,
    }));
};
