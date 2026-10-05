import {
  Button,
  CurrencyInput,
  Drawer,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { QueryCompany } from "../../../../../types";
import { CoolSwitch } from "../../../../components/common";
import { useCreateEmployee } from "../../../../hooks/api";
import { sdk } from "../../../../lib/client";
import { currencySymbolMap } from "../../../../utils";

type CustomerResult = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  employee?: { id: string } | null;
};

/**
 * Assigns an existing registered customer, who doesn't belong to a company
 * yet, to this company.
 */
export function EmployeeAddExistingDrawer({
  company,
}: {
  company: QueryCompany;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<CustomerResult | null>(null);
  const [spendingLimit, setSpendingLimit] = useState("0");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isFetching } = useQuery({
    queryKey: ["company-assignable-customers", debouncedSearch],
    queryFn: () =>
      sdk.admin.customer.list({
        q: debouncedSearch || undefined,
        has_account: true,
        limit: 10,
        fields: "id,email,first_name,last_name,employee.id",
      }),
    enabled: open,
  });

  const customers = (data?.customers ?? []) as unknown as CustomerResult[];

  const {
    mutateAsync: addEmployee,
    isPending,
    error,
    reset,
  } = useCreateEmployee(company.id);

  const resetForm = () => {
    setSearch("");
    setSelected(null);
    setSpendingLimit("0");
    setIsAdmin(false);
    reset();
  };

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      resetForm();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected) {
      return;
    }

    try {
      await addEmployee({
        customer_id: selected.id,
        spending_limit: spendingLimit ? parseInt(spendingLimit) : 0,
        is_admin: isAdmin,
      });
    } catch {
      // The error is surfaced through `error`
      return;
    }

    toast.success(`${selected.email} was added to ${company.name}`);
    onOpenChange(false);
  };

  const currencyCode = company.currency_code || "USD";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>
        <Button variant="secondary" size="small">
          Add existing customer
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Add Existing Customer</Drawer.Title>
        </Drawer.Header>
        <form onSubmit={onSubmit} className="flex flex-1 flex-col">
          <Drawer.Body className="flex flex-col p-4 gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="h2-core">Customer</h2>
              <Text size="small" className="text-ui-fg-subtle">
                Only registered customers that don't belong to a company can
                be added.
              </Text>
              <Input
                type="search"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex flex-col gap-2">
                {isFetching && customers.length === 0 ? (
                  <Text size="small" className="text-ui-fg-muted">
                    Loading...
                  </Text>
                ) : customers.length === 0 ? (
                  <Text size="small" className="text-ui-fg-muted">
                    No customers found.
                  </Text>
                ) : (
                  customers.map((customer) => {
                    const inCompany = !!customer.employee?.id;
                    const isSelected = selected?.id === customer.id;
                    const name = [customer.first_name, customer.last_name]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        key={customer.id}
                        type="button"
                        disabled={inCompany}
                        onClick={() => setSelected(customer)}
                        className={`flex flex-col items-start rounded-md border px-3 py-2 text-left ${
                          isSelected
                            ? "border-ui-border-interactive bg-ui-bg-highlight"
                            : "border-ui-border-base"
                        } ${
                          inCompany
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-ui-bg-base-hover"
                        }`}
                      >
                        <Text size="small" weight="plus" leading="compact">
                          {customer.email}
                        </Text>
                        <Text
                          size="small"
                          leading="compact"
                          className="text-ui-fg-subtle"
                        >
                          {inCompany
                            ? "Already belongs to a company"
                            : name || "No name"}
                        </Text>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="h2-core">Permissions</h2>
              <div className="flex flex-col gap-2">
                <Label size="xsmall" className="txt-compact-small font-medium">
                  Spending Limit ({currencyCode.toUpperCase()})
                </Label>
                <CurrencyInput
                  symbol={currencySymbolMap[currencyCode]}
                  code={currencyCode}
                  type="text"
                  name="spending_limit"
                  value={spendingLimit}
                  onChange={(e) =>
                    setSpendingLimit(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="1000"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label size="xsmall" className="txt-compact-small font-medium">
                  Admin Access
                </Label>
                <CoolSwitch
                  fieldName="is_admin"
                  label="Is Admin"
                  description="Enable to grant admin access"
                  checked={isAdmin}
                  onChange={setIsAdmin}
                  tooltip="Admins can manage the company's details and employee permissions."
                />
              </div>
            </div>
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
              disabled={!selected || isPending}
              isLoading={isPending}
            >
              Add to company
            </Button>
            {error && <Text className="text-red-500">{error.message}</Text>}
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
}
