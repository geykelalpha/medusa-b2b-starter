import { MedusaService } from "@medusajs/framework/utils";
import { Company, Employee, EmployeeInvite } from "./models";

class CompanyModuleService extends MedusaService({
  Company,
  Employee,
  EmployeeInvite,
}) {}

export default CompanyModuleService;
