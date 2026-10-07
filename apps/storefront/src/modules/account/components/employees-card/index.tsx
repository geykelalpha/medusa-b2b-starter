import { retrieveCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"
import EmployeesTree from "@/modules/account/components/employees-card/employees-tree"
import { ModuleEmployeeInvite, QueryCompany } from "@/types"

const EmployeesCard = async ({
  company,
  invites,
}: {
  company: QueryCompany
  invites: ModuleEmployeeInvite[]
}) => {
  const customer = await retrieveCustomer()

  // Fetched once for the whole tree (each row used to fetch them again)
  const customerOrders = await listOrders()
  const orderIds = customerOrders.map((order) => order.id)
  const orders =
    orderIds.length > 0
      ? await listOrders(0, 0, { id: orderIds }).catch(() => [])
      : []

  return (
    <EmployeesTree
      company={company}
      invites={invites}
      customer={customer}
      orders={orders}
    />
  )
}

export default EmployeesCard
