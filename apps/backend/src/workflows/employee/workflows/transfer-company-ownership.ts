import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  transferCompanyOwnershipStep,
  validateOwnershipTransferStep,
  ValidateOwnershipTransferInput,
} from "../steps";

/**
 * Makes another admin of the company its owner. The previous owner stays an
 * admin.
 */
export const transferCompanyOwnershipWorkflow = createWorkflow(
  "transfer-company-ownership",
  function (input: ValidateOwnershipTransferInput) {
    const transfer = validateOwnershipTransferStep(input);

    const result = transferCompanyOwnershipStep(transfer);

    return new WorkflowResponse(result);
  }
);
