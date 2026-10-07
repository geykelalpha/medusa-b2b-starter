import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ModuleUpdateEmployee, QueryEmployee } from "../../../types";
import {
  claimCompanyOwnershipStep,
  removeAdminRoleStep,
  setAdminRoleStep,
  updateEmployeesStep,
  validateEmployeeParentStep,
  validateEmployeeUpdateStep,
} from "../steps";

type WorkflowInput = ModuleUpdateEmployee & {
  company_id: string;
  /** The storefront customer making the change. Omitted for the merchant. */
  requested_by_customer_id?: string;
};

export const updateEmployeesWorkflow = createWorkflow(
  "update-employees",
  (input: WorkflowData<WorkflowInput>): WorkflowResponse<QueryEmployee> => {
    validateEmployeeUpdateStep({
      id: input.id,
      company_id: input.company_id,
      is_admin: input.is_admin,
      requested_by_customer_id: input.requested_by_customer_id,
    });

    // Moving an employee in the tree is an update of its parent
    validateEmployeeParentStep({
      company_id: input.company_id,
      employee_id: input.id,
      parent_employee_id: input.parent_employee_id,
    });

    const employeeData = transform({ input }, ({ input }) => {
      const data: ModuleUpdateEmployee & { requested_by_customer_id?: string } =
        { ...input };
      delete data.requested_by_customer_id;
      return data as ModuleUpdateEmployee;
    });

    const updatedEmployee = updateEmployeesStep(employeeData);

    when(updatedEmployee, ({ is_admin }) => {
      return is_admin === false;
    }).then(() => {
      removeAdminRoleStep({
        email: updatedEmployee.customer.email,
      });
    });

    when(
      "promote-employee-to-admin",
      { input, updatedEmployee },
      ({ input, updatedEmployee }) =>
        input.is_admin === true && updatedEmployee.is_admin === true
    ).then(() => {
      setAdminRoleStep({
        employeeId: updatedEmployee.id,
        customerId: updatedEmployee.customer.id,
      });

      // The first admin of a company without an owner becomes its owner
      claimCompanyOwnershipStep({
        employee_id: updatedEmployee.id,
        company_id: updatedEmployee.company_id,
      });
    });

    return new WorkflowResponse(updatedEmployee);
  }
);
