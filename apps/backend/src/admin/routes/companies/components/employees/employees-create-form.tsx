import {
  Button,
  CurrencyInput,
  Drawer,
  Input,
  Label,
  Text,
} from "@medusajs/ui";
import { useState } from "react";
import { AdminCreateEmployeeInvite, QueryCompany } from "../../../../../types";
import { CoolSwitch } from "../../../../components/common";
import { currencySymbolMap } from "../../../../utils";
import { EmployeeParentSelect } from "./employee-parent-select";

export function EmployeesCreateForm({
  handleSubmit,
  loading,
  error,
  company,
  defaultParentId = null,
}: {
  handleSubmit: (data: AdminCreateEmployeeInvite) => Promise<void>;
  loading: boolean;
  error: Error | null;
  company: QueryCompany;
  defaultParentId?: string | null;
}) {
  const [formData, setFormData] = useState<
    Omit<AdminCreateEmployeeInvite, "spending_limit"> & {
      spending_limit: string;
    }
  >({
    email: "",
    is_admin: false,
    spending_limit: "0",
    parent_employee_id: defaultParentId,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const spendingLimit = formData.spending_limit
      ? parseInt(formData.spending_limit)
      : 0;

    const data = {
      ...formData,
      spending_limit: spendingLimit,
    };

    handleSubmit(data).catch(() => {
      // The error is surfaced through the `error` prop
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <Drawer.Body className="flex flex-col p-4 gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="h2-core">Details</h2>
          <div className="flex flex-col gap-2">
            <Label size="xsmall" className="txt-compact-small font-medium">
              First Name
            </Label>
            <Input
              type="text"
              name="first_name"
              onChange={handleChange}
              placeholder="John"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label size="xsmall" className="txt-compact-small font-medium">
              Last Name
            </Label>
            <Input
              type="text"
              name="last_name"
              onChange={handleChange}
              placeholder="Doe"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label size="xsmall" className="txt-compact-small font-medium">
              Email
            </Label>
            <Input
              type="email"
              name="email"
              required
              onChange={handleChange}
              placeholder="john.doe@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label size="xsmall" className="txt-compact-small font-medium">
              Phone
            </Label>
            <Input
              type="text"
              name="phone"
              onChange={handleChange}
              placeholder="0612345678"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="h2-core">Placement</h2>
          <EmployeeParentSelect
            employees={company.employees ?? []}
            value={formData.parent_employee_id ?? null}
            onChange={(parent_employee_id) =>
              setFormData({ ...formData, parent_employee_id })
            }
          />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="h2-core">Permissions</h2>
          <div className="flex flex-col gap-2">
            <Label size="xsmall" className="txt-compact-small font-medium">
              Spending Limit ({company.currency_code?.toUpperCase() || "USD"})
            </Label>
            <CurrencyInput
              symbol={currencySymbolMap[company.currency_code || "USD"]}
              code={company.currency_code || "USD"}
              type="text"
              name="spending_limit"
              value={formData.spending_limit ? formData.spending_limit : ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  spending_limit: e.target.value.replace(/[^0-9]/g, ""),
                })
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
              checked={formData.is_admin || false}
              onChange={(checked) =>
                setFormData({ ...formData, is_admin: checked })
              }
              tooltip="Admins can manage the company's details and employee permissions."
            />
          </div>
        </div>
      </Drawer.Body>
      <Drawer.Footer>
        <Drawer.Close asChild>
          <Button variant="secondary">Cancel</Button>
        </Drawer.Close>
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send invite"}
        </Button>
        {error && <Text className="text-red-500">{error.message}</Text>}
      </Drawer.Footer>
    </form>
  );
}
