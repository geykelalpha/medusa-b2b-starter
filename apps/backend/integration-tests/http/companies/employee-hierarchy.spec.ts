import { IEventBusModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";

jest.setTimeout(60 * 1000);

type Member = { customerId: string; employeeId: string; token: string };

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    JWT_SECRET: "supersecret",
  },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: { headers: Record<string, string> };
    const sentTokens: Record<string, string> = {};
    let subscribed = false;

    const withAuth = (token: string) => ({
      headers: { ...storeHeaders.headers, Authorization: `Bearer ${token}` },
    });

    const waitForToken = async (inviteId: string) => {
      for (let i = 0; i < 50; i++) {
        if (sentTokens[inviteId]) {
          return sentTokens[inviteId];
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error(`No invite token emitted for ${inviteId}`);
    };

    const login = async (email: string) =>
      (
        await api.post("/auth/customer/emailpass", {
          email,
          password: "password",
        })
      ).data.token as string;

    const signup = async (email: string) => {
      const registrationToken = (
        await api.post("/auth/customer/emailpass/register", {
          email,
          password: "password",
        })
      ).data.token as string;

      const { customer } = (
        await api.post(
          "/store/customers",
          { email, first_name: "Jane", last_name: "Doe" },
          withAuth(registrationToken)
        )
      ).data;

      return { customer, token: await login(email) };
    };

    const getParents = async (companyId: string) => {
      const employees = (
        await api.get(
          `/admin/companies/${companyId}/employees?fields=id,parent_employee_id`,
          adminHeaders
        )
      ).data.employees as { id: string; parent_employee_id: string | null }[];

      return Object.fromEntries(
        employees.map((employee) => [employee.id, employee.parent_employee_id])
      );
    };

    /** Adds a new customer to the company through the admin. */
    const addMember = async (
      companyId: string,
      email: string,
      body: Record<string, unknown> = {}
    ): Promise<Member> => {
      const { customer, token } = await signup(email);
      const { employee } = (
        await api.post(
          `/admin/companies/${companyId}/employees`,
          { customer_id: customer.id, is_admin: false, ...body },
          adminHeaders
        )
      ).data;
      return { customerId: customer.id, employeeId: employee.id, token };
    };

    /**
     * A storefront company with this tree:
     *   owner
     *   └─ lead
     *      └─ member
     */
    const setupCompany = async () => {
      const { token } = await signup("owner@example.com");
      const { company } = (
        await api.post(
          "/store/companies",
          { name: "Acme", email: "acme@example.com", currency_code: "usd" },
          withAuth(token)
        )
      ).data;

      const me = (
        await api.get("/store/customers/me?fields=*employee", withAuth(token))
      ).data.customer;

      const owner = { customerId: me.id, employeeId: me.employee.id, token };
      const lead = await addMember(company.id, "lead@example.com", {
        parent_employee_id: owner.employeeId,
      });
      const member = await addMember(company.id, "member@example.com", {
        parent_employee_id: lead.employeeId,
      });

      return { companyId: company.id as string, owner, lead, member };
    };

    const createOtherCompany = async () => {
      const { companies } = (
        await api.post(
          "/admin/companies",
          { name: "Other", email: "other@example.com", currency_code: "usd" },
          adminHeaders
        )
      ).data;
      const companyId = companies[0].id as string;
      const outsider = await addMember(companyId, "outsider@example.com");
      return { companyId, outsider };
    };

    const expectStatus = async (request: Promise<unknown>, status: number) => {
      const err = await request.then(
        () => null,
        (e) => e
      );
      expect(err?.response?.status).toBe(status);
      return err;
    };

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      storeHeaders = generateStoreHeaders({ publishableKey });

      if (!subscribed) {
        // The container outlives each test, so only subscribe once
        container
          .resolve<IEventBusModuleService>(Modules.EVENT_BUS)
          .subscribe("employee_invite.sent", async (event: any) => {
            sentTokens[event.data.id] = event.data.token;
          });
        subscribed = true;
      }
    });

    describe("placing employees", () => {
      it("adds existing customers under a parent", async () => {
        const { companyId, owner, lead, member } = await setupCompany();

        expect(await getParents(companyId)).toEqual({
          [owner.employeeId]: null,
          [lead.employeeId]: owner.employeeId,
          [member.employeeId]: lead.employeeId,
        });
      });

      it("rejects a parent from another company or one that doesn't exist", async () => {
        const { companyId } = await setupCompany();
        const { outsider } = await createOtherCompany();

        const { customer } = await signup("new@example.com");

        await expectStatus(
          api.post(
            `/admin/companies/${companyId}/employees`,
            { customer_id: customer.id, parent_employee_id: outsider.employeeId },
            adminHeaders
          ),
          400
        );

        await expectStatus(
          api.post(
            `/admin/companies/${companyId}/employees`,
            { customer_id: customer.id, parent_employee_id: "emp_missing" },
            adminHeaders
          ),
          404
        );
      });
    });

    describe("moving employees", () => {
      it("moves an employee through the admin and the store", async () => {
        const { companyId, owner, lead, member } = await setupCompany();

        await api.post(
          `/admin/companies/${companyId}/employees/${member.employeeId}`,
          { parent_employee_id: owner.employeeId },
          adminHeaders
        );
        expect((await getParents(companyId))[member.employeeId]).toBe(
          owner.employeeId
        );

        await api.post(
          `/store/companies/${companyId}/employees/${lead.employeeId}`,
          { parent_employee_id: null },
          withAuth(owner.token)
        );
        expect((await getParents(companyId))[lead.employeeId]).toBeNull();
      });

      it("rejects moves that would create a cycle", async () => {
        const { companyId, owner, lead, member } = await setupCompany();

        await expectStatus(
          api.post(
            `/admin/companies/${companyId}/employees/${lead.employeeId}`,
            { parent_employee_id: lead.employeeId },
            adminHeaders
          ),
          400
        );

        // owner → lead → member, so the owner can't go under the member
        await expectStatus(
          api.post(
            `/store/companies/${companyId}/employees/${owner.employeeId}`,
            { parent_employee_id: member.employeeId },
            withAuth(owner.token)
          ),
          400
        );

        expect((await getParents(companyId))[owner.employeeId]).toBeNull();
      });

      it("rejects a parent from another company", async () => {
        const { companyId, member } = await setupCompany();
        const { outsider } = await createOtherCompany();

        await expectStatus(
          api.post(
            `/admin/companies/${companyId}/employees/${member.employeeId}`,
            { parent_employee_id: outsider.employeeId },
            adminHeaders
          ),
          400
        );
      });

      it("doesn't let a regular employee move anyone", async () => {
        const { companyId, owner, member } = await setupCompany();

        await expectStatus(
          api.post(
            `/store/companies/${companyId}/employees/${member.employeeId}`,
            { parent_employee_id: owner.employeeId },
            withAuth(member.token)
          ),
          403
        );
      });
    });

    describe("inviting under a parent", () => {
      it("places the accepted employee under the invite's parent", async () => {
        const { companyId, owner, lead } = await setupCompany();

        const { invite } = (
          await api.post(
            `/store/companies/${companyId}/invites`,
            { email: "hire@example.com", parent_employee_id: lead.employeeId },
            withAuth(owner.token)
          )
        ).data;
        expect(invite.parent_employee_id).toBe(lead.employeeId);

        const token = await waitForToken(invite.id);
        const registrationToken = (
          await api.post("/auth/customer/emailpass/register", {
            email: "hire@example.com",
            password: "password",
          })
        ).data.token as string;

        const { employee } = (
          await api.post(
            `/store/employee-invites/${token}/accept`,
            { first_name: "New", last_name: "Hire" },
            withAuth(registrationToken)
          )
        ).data;

        expect((await getParents(companyId))[employee.id]).toBe(
          lead.employeeId
        );
      });

      it("rejects a parent from another company", async () => {
        const { companyId } = await setupCompany();
        const { outsider } = await createOtherCompany();

        await expectStatus(
          api.post(
            `/admin/companies/${companyId}/invites`,
            {
              email: "hire@example.com",
              parent_employee_id: outsider.employeeId,
            },
            adminHeaders
          ),
          400
        );
      });
    });

    describe("removing a parent", () => {
      it("moves its children and pending invites up a level", async () => {
        const { companyId, owner, lead, member } = await setupCompany();

        const { invite } = (
          await api.post(
            `/admin/companies/${companyId}/invites`,
            { email: "hire@example.com", parent_employee_id: lead.employeeId },
            adminHeaders
          )
        ).data;

        await api.delete(
          `/admin/companies/${companyId}/employees/${lead.employeeId}`,
          adminHeaders
        );

        const parents = await getParents(companyId);
        expect(parents[lead.employeeId]).toBeUndefined();
        expect(parents[member.employeeId]).toBe(owner.employeeId);

        const { invites } = (
          await api.get(`/admin/companies/${companyId}/invites`, adminHeaders)
        ).data;
        expect(
          invites.find((i: { id: string }) => i.id === invite.id)
            .parent_employee_id
        ).toBe(owner.employeeId);
      });

      it("makes the children of a top-level employee top level", async () => {
        const { companyId, owner, lead, member } = await setupCompany();

        await api.post(
          `/admin/companies/${companyId}/employees/${lead.employeeId}`,
          { parent_employee_id: null },
          adminHeaders
        );

        await api.delete(
          `/store/companies/${companyId}/employees/${lead.employeeId}`,
          withAuth(owner.token)
        );

        expect((await getParents(companyId))[member.employeeId]).toBeNull();
      });
    });
  },
});
