import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ModuleCreateCompany } from "../../../types";
import { validateCustomerCanJoinCompanyStep } from "../../employee/steps";
import { createEmployeesWorkflow } from "../../employee/workflows";
import { createCompaniesWorkflow } from "./create-companies";

type WorkflowInput = {
  customer_id: string;
  company: ModuleCreateCompany;
};

/**
 * Creates a company for a customer that doesn't belong to one yet and makes
 * the customer its admin employee.
 */
export const createCompanyForCustomerWorkflow = createWorkflow(
  "create-company-for-customer",
  function (input: WorkflowInput) {
    // Fail before creating anything if the customer can't join a company
    validateCustomerCanJoinCompanyStep({ customer_id: input.customer_id });

    const companiesInput = transform({ input }, ({ input }) => [input.company]);

    const companies = createCompaniesWorkflow.runAsStep({
      input: companiesInput,
    });

    const employeeInput = transform(
      { input, companies },
      ({ input, companies }) => ({
        employeeData: {
          company_id: companies[0].id,
          customer_id: input.customer_id,
          spending_limit: 0,
          is_admin: true,
        },
        customerId: input.customer_id,
      })
    );

    const employee = createEmployeesWorkflow.runAsStep({
      input: employeeInput,
    });

    const company = transform({ companies }, ({ companies }) => companies[0]);

    return new WorkflowResponse({ company, employee });
  }
);
