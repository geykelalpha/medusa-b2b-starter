import { CustomerDTO } from "@medusajs/framework/types";
import {
  ModuleCompany,
  ModuleEmployee,
  ModuleEmployeeInvite,
} from "./module";
import { QueryApprovalSettings } from "../approval/query";
import { HttpTypes } from "@medusajs/framework/types";

export type QueryCompany = ModuleCompany & {
  employees: QueryEmployee[];
  invites?: QueryEmployeeInvite[];
  approval_settings: QueryApprovalSettings;
  carts: HttpTypes.StoreCart[];
};

export type QueryEmployee = ModuleEmployee & {
  company: QueryCompany;
  customer: CustomerDTO;
};

export type QueryEmployeeInvite = Omit<ModuleEmployeeInvite, "token_hash"> & {
  company?: QueryCompany;
};
