import { retrieveCustomer } from "@/lib/data/customer"
import { retrieveInvite } from "@/lib/data/invites"
import AcceptInvite from "@/modules/account/components/accept-invite"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Accept invite",
  description: "Join your company's account.",
}

export default async function InvitePage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { countryCode } = await props.params
  const { token } = await props.searchParams

  const [invite, customer] = await Promise.all([
    token ? retrieveInvite(token) : null,
    retrieveCustomer(),
  ])

  return (
    <div className="flex justify-center items-center bg-neutral-100 p-6 m-2 min-h-[80vh]">
      <AcceptInvite
        token={token ?? ""}
        invite={invite}
        countryCode={countryCode}
        currentCustomer={
          customer
            ? {
                email: customer.email,
                hasCompany: !!customer.employee,
              }
            : null
        }
      />
    </div>
  )
}
