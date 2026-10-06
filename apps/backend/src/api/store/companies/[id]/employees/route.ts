import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StoreGetEmployeeParamsType } from "../../validators";

export const GET = async (
  req: MedusaRequest<StoreGetEmployeeParamsType>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [{ employees }],
    metadata,
  } = await query.graph(
    {
      entity: "company",
      fields: [...req.queryConfig.fields, "employees.*"],
      filters: {
        id,
        ...req.filterableFields,
      },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({
    employees,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};
