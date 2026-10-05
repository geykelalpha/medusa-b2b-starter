import { IAuthModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
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
  address: "1 Main St",
  city: "Springfield",
  zip: "12345",
  country: "United States",
};

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

    const login = async (email: string, password = "password") =>
      (await api.post("/auth/customer/emailpass", { email, password })).data
        .token as string;

    /** Registers a storefront customer without a company, like the new signup. */
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

    const getMe = async (token: string) =>
      (
        await api.get(
          "/store/customers/me?fields=*employee,*employee.company",
          withAuth(token)
        )
      ).data.customer;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      storeHeaders = generateStoreHeaders({ publishableKey });
    });

    describe("signup without a company", () => {
      it("creates a customer that doesn't belong to a company", async () => {
        const { token } = await signup("solo@example.com");

        const customer = await getMe(token);

        expect(customer.email).toBe("solo@example.com");
        expect(customer.employee).toBeFalsy();
      });
    });

    describe("POST /store/companies", () => {
      it("creates a company and makes the customer its admin", async () => {
        const { customer, token } = await signup("owner@example.com");

        const { company } = (
          await api.post("/store/companies", companyBody, withAuth(token))
        ).data;

        expect(company).toEqual(
          expect.objectContaining({ id: expect.any(String), name: "Acme" })
        );

        const me = await getMe(token);
        expect(me.employee).toEqual(
          expect.objectContaining({ company_id: company.id, is_admin: true })
        );

        // The admin role is set on the auth identity too
        const authModule = getContainer().resolve<IAuthModuleService>(
          Modules.AUTH
        );
        const [providerIdentity] = await authModule.listProviderIdentities({
          entity_id: "owner@example.com",
          provider: "emailpass",
        });
        expect(providerIdentity.user_metadata?.role).toBe("company_admin");
        expect(me.id).toBe(customer.id);
      });

      it("rejects a customer that already belongs to a company", async () => {
        const { token } = await signup("twice@example.com");

        await api.post("/store/companies", companyBody, withAuth(token));

        const err = await api
          .post(
            "/store/companies",
            { ...companyBody, name: "Second" },
            withAuth(token)
          )
          .catch((e) => e);

        expect(err.response.status).toBe(400);

        // No second company was left behind
        const { companies } = (await api.get("/admin/companies", adminHeaders))
          .data;
        expect(companies.map((c: { name: string }) => c.name)).not.toContain(
          "Second"
        );
      });

      it("no longer accepts an array of companies", async () => {
        const { token } = await signup("array@example.com");

        const err = await api
          .post("/store/companies", [companyBody], withAuth(token))
          .catch((e) => e);

        expect(err.response.status).toBe(400);
      });

      it("no longer exposes the store employee create route", async () => {
        const { token } = await signup("owner2@example.com");
        const { customer: other } = await signup("other@example.com");

        const { company } = (
          await api.post("/store/companies", companyBody, withAuth(token))
        ).data;

        const err = await api
          .post(
            `/store/companies/${company.id}/employees`,
            { customer_id: other.id, is_admin: true },
            withAuth(token)
          )
          .catch((e) => e);

        expect(err.response.status).toBe(404);
      });
    });

    describe("POST /admin/companies/:id/employees", () => {
      let companyId: string;

      beforeEach(async () => {
        companyId = (
          await api.post("/admin/companies", companyBody, adminHeaders)
        ).data.companies[0].id;
      });

      it("assigns an existing customer without a company", async () => {
        const { customer, token } = await signup("assign@example.com");

        const { employee } = (
          await api.post(
            `/admin/companies/${companyId}/employees`,
            { customer_id: customer.id, spending_limit: 100, is_admin: false },
            adminHeaders
          )
        ).data;

        expect(employee).toEqual(
          expect.objectContaining({ company_id: companyId, is_admin: false })
        );

        const me = await getMe(token);
        expect(me.employee.company_id).toBe(companyId);
      });

      it("rejects a customer that already belongs to a company", async () => {
        const { customer } = await signup("taken@example.com");

        await api.post(
          `/admin/companies/${companyId}/employees`,
          { customer_id: customer.id },
          adminHeaders
        );

        const otherCompanyId = (
          await api.post(
            "/admin/companies",
            { ...companyBody, name: "Other" },
            adminHeaders
          )
        ).data.companies[0].id;

        const err = await api
          .post(
            `/admin/companies/${otherCompanyId}/employees`,
            { customer_id: customer.id },
            adminHeaders
          )
          .catch((e) => e);

        expect(err.response.status).toBe(400);
      });

      it("rejects a guest customer", async () => {
        const { customer } = (
          await api.post(
            "/admin/customers",
            { email: "guest@example.com" },
            adminHeaders
          )
        ).data;

        const err = await api
          .post(
            `/admin/companies/${companyId}/employees`,
            { customer_id: customer.id },
            adminHeaders
          )
          .catch((e) => e);

        expect(err.response.status).toBe(400);
      });
    });

    describe("POST /store/quotes", () => {
      it("rejects a customer without a company", async () => {
        const { token } = await signup("noquote@example.com");

        const err = await api
          .post("/store/quotes", { cart_id: "cart_fake" }, withAuth(token))
          .catch((e) => e);

        expect(err.response.status).toBe(400);
        expect(err.response.data.message).toMatch(/belong to a company/);
      });

      it("lets a company member past the company check", async () => {
        const { token } = await signup("member@example.com");
        await api.post("/store/companies", companyBody, withAuth(token));

        const err = await api
          .post("/store/quotes", { cart_id: "cart_fake" }, withAuth(token))
          .catch((e) => e);

        // Fails later, on the missing cart
        expect(err.response.data.message).not.toMatch(/belong to a company/);
      });
    });
  },
});
