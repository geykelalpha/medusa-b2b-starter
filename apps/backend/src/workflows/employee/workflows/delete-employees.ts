import {
  createWorkflow,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteEmployeesStep, validateEmployeesRemovableStep } from "../steps";

type WorkflowInput = {
  company_id: string;
  employee_ids: string[];
};

export const deleteEmployeesWorkflow = createWorkflow(
  "delete-employees",
  (input: WorkflowData<WorkflowInput>): WorkflowResponse<string> => {
    validateEmployeesRemovableStep(input);

    deleteEmployeesStep(input.employee_ids);

    return new WorkflowResponse("Company customers deleted");
  }
);
