import {
  createWorkflow,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  deleteEmployeesStep,
  reparentChildrenStep,
  validateEmployeesRemovableStep,
} from "../steps";

type WorkflowInput = {
  company_id: string;
  employee_ids: string[];
};

export const deleteEmployeesWorkflow = createWorkflow(
  "delete-employees",
  (input: WorkflowData<WorkflowInput>): WorkflowResponse<string> => {
    validateEmployeesRemovableStep(input);

    // Children (and pending invites) of removed employees move up a level
    reparentChildrenStep(input);

    deleteEmployeesStep(input.employee_ids);

    return new WorkflowResponse("Company customers deleted");
  }
);
