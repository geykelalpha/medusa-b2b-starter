import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";

jest.setTimeout(60 * 1000);

const companyBody = {
  name: "Acme",
  email: "acme@example.com",
  currency_code: "usd",
};

type Member = { customerId: string; employeeId: string; token: string };

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    JWT_SECRET: "supersecret",
  },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: { headers: Record<string, string> };

    const withAuth = (token: string) => ({
      headers: { ...storeHeaders.headers, Authorization: `Bearer ${token}` },
    });

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

    const getEmployees = async (companyId: string) =>
      (
        await api.get(
          `/admin/companies/${companyId}/employees?fields=id,is_admin,is_owner`,
          adminHeaders
        )
      ).data.employees as {
        id: string;
        is_admin: boolean;
        is_owner: boolean;
      }[];

    const getEmployee = async (companyId: string, employeeId: string) =>
      (await getEmployees(companyId)).find(
        (employee) => employee.id === employeeId
      );

    /** Adds a new customer to the company through the admin. */
    const addMember = async (
      companyId: string,
      email: string,
      is_admin: boolean
    ): Promise<Member> => {
      const { customer, token } = await signup(email);
      const { employee } = (
        await api.post(
          `/admin/companies/${companyId}/employees`,
          { customer_id: customer.id, is_admin },
          adminHeaders
        )
      ).data;
      return { customerId: customer.id, employeeId: employee.id, token };
    };

    /** A company created on the storefront, with its owner and another admin. */
    const setupCompany = async () => {
      const { customer, token } = await signup("owner@example.com");
      const { company } = (
        await api.post("/store/companies", companyBody, withAuth(token))
      ).data;

      const me = (
        await api.get("/store/customers/me?fields=*employee", withAuth(token))
      ).data.customer;

      const owner: Member = {
        customerId: customer.id,
        employeeId: me.employee.id,
        token,
      };
      const admin = await addMember(company.id, "admin@example.com", true);
      const member = await addMember(company.id, "member@example.com", false);

      return { companyId: company.id as string, owner, admin, member };
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
    });

    describe("assigning the owner", () => {
      it("makes the customer who creates the company its owner", async () => {
        const { companyId, owner, admin } = await setupCompany();

        expect(await getEmployee(companyId, owner.employeeId)).toEqual(
          expect.objectContaining({ is_admin: true, is_owner: true })
        );
        expect((await getEmployee(companyId, admin.employeeId))?.is_owner).toBe(
          false
        );
      });

      it("makes the first admin of a merchant-created company its owner", async () => {
        const companyId = (
          await api.post("/admin/companies", companyBody, adminHeaders)
        ).data.companies[0].id;

        const member = await addMember(companyId, "first@example.com", false);
        const admin = await addMember(companyId, "second@example.com", true);
        const otherAdmin = await addMember(companyId, "third@example.com", true);

        expect((await getEmployee(companyId, member.employeeId))?.is_owner).toBe(
          false
        );
        expect((await getEmployee(companyId, admin.employeeId))?.is_owner).toBe(
          true
        );
        expect(
          (await getEmployee(companyId, otherAdmin.employeeId))?.is_owner
        ).toBe(false);
      });

      it("makes an employee promoted to admin the owner if there is none", async () => {
        const companyId = (
          await api.post("/admin/companies", companyBody, adminHeaders)
        ).data.companies[0].id;

        const member = await addMember(companyId, "promoted@example.com", false);

        await api.post(
          `/admin/companies/${companyId}/employees/${member.employeeId}`,
          { id: member.employeeId, is_admin: true },
          adminHeaders
        );

        expect(await getEmployee(companyId, member.employeeId)).toEqual(
          expect.objectContaining({ is_admin: true, is_owner: true })
        );
      });
    });

    describe("protecting the owner", () => {
      it("doesn't let anyone remove the owner", async () => {
        const { companyId, owner, admin } = await setupCompany();
        const ownerUrl = `/store/companies/${companyId}/employees/${owner.employeeId}`;

        // Another admin
        await expectStatus(api.delete(ownerUrl, withAuth(admin.token)), 400);
        // The owner themselves, before transferring
        await expectStatus(api.delete(ownerUrl, withAuth(owner.token)), 400);
        // The merchant
        await expectStatus(
          api.delete(
            `/admin/companies/${companyId}/employees/${owner.employeeId}`,
            adminHeaders
          ),
          400
        );

        expect(await getEmployee(companyId, owner.employeeId)).toBeDefined();
      });

      it("still lets admins remove other employees", async () => {
        const { companyId, admin, member } = await setupCompany();

        await api.delete(
          `/store/companies/${companyId}/employees/${member.employeeId}`,
          withAuth(admin.token)
        );

        expect(await getEmployee(companyId, member.employeeId)).toBeUndefined();
      });

      it("doesn't let other admins edit the owner", async () => {
        const { companyId, owner, admin } = await setupCompany();

        await expectStatus(
          api.post(
            `/store/companies/${companyId}/employees/${owner.employeeId}`,
            { spending_limit: 1 },
            withAuth(admin.token)
          ),
          400
        );
      });

      it("doesn't let the owner lose admin access", async () => {
        const { companyId, owner } = await setupCompany();

        await expectStatus(
          api.post(
            `/store/companies/${companyId}/employees/${owner.employeeId}`,
            { is_admin: false },
            withAuth(owner.token)
          ),
          400
        );
        await expectStatus(
          api.post(
            `/admin/companies/${companyId}/employees/${owner.employeeId}`,
            { id: owner.employeeId, is_admin: false },
            adminHeaders
          ),
          400
        );

        // The owner can still edit their own spending limit
        await api.post(
          `/store/companies/${companyId}/employees/${owner.employeeId}`,
          { spending_limit: 500 },
          withAuth(owner.token)
        );
      });

      it("doesn't remove employees of another company", async () => {
        const { companyId, member } = await setupCompany();
        const otherCompanyId = (
          await api.post(
            "/admin/companies",
            { ...companyBody, name: "Other" },
            adminHeaders
          )
        ).data.companies[0].id;

        await expectStatus(
          api.delete(
            `/admin/companies/${otherCompanyId}/employees/${member.employeeId}`,
            adminHeaders
          ),
          404
        );
        expect(await getEmployee(companyId, member.employeeId)).toBeDefined();
      });
    });

    describe("transferring ownership", () => {
      it("lets the owner transfer to another admin", async () => {
        const { companyId, owner, admin } = await setupCompany();

        const { company } = (
          await api.post(
            `/store/companies/${companyId}/transfer-ownership`,
            { employee_id: admin.employeeId },
            withAuth(owner.token)
          )
        ).data;
        expect(company.id).toBe(companyId);

        expect(await getEmployee(companyId, admin.employeeId)).toEqual(
          expect.objectContaining({ is_owner: true })
        );
        expect(await getEmployee(companyId, owner.employeeId)).toEqual(
          expect.objectContaining({ is_admin: true, is_owner: false })
        );

        // The previous owner can now be removed by the new owner
        await api.delete(
          `/store/companies/${companyId}/employees/${owner.employeeId}`,
          withAuth(admin.token)
        );
        expect(await getEmployee(companyId, owner.employeeId)).toBeUndefined();
      });

      it("only lets the owner transfer", async () => {
        const { companyId, admin, member } = await setupCompany();

        // A non-owner admin
        await expectStatus(
          api.post(
            `/store/companies/${companyId}/transfer-ownership`,
            { employee_id: admin.employeeId },
            withAuth(admin.token)
          ),
          400
        );
        // A regular employee is stopped by the admin check
        await expectStatus(
          api.post(
            `/store/companies/${companyId}/transfer-ownership`,
            { employee_id: admin.employeeId },
            withAuth(member.token)
          ),
          403
        );
      });

      it("only transfers to an admin of the same company", async () => {
        const { companyId, owner, member } = await setupCompany();

        await expectStatus(
          api.post(
            `/store/companies/${companyId}/transfer-ownership`,
            { employee_id: member.employeeId },
            withAuth(owner.token)
          ),
          400
        );
        await expectStatus(
          api.post(
            `/store/companies/${companyId}/transfer-ownership`,
            { employee_id: "emp_does_not_exist" },
            withAuth(owner.token)
          ),
          404
        );
      });

      it("lets the merchant transfer ownership", async () => {
        const { companyId, owner, admin } = await setupCompany();

        await api.post(
          `/admin/companies/${companyId}/transfer-ownership`,
          { employee_id: admin.employeeId },
          adminHeaders
        );

        expect((await getEmployee(companyId, admin.employeeId))?.is_owner).toBe(
          true
        );
        expect((await getEmployee(companyId, owner.employeeId))?.is_owner).toBe(
          false
        );
      });
    });
  },
});
