import { IEventBusModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders, createAdminUser, createStoreUser } from "../../utils/admin";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    JWT_SECRET: "supersecret",
  },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: { headers: Record<string, string> };
    let company: { id: string };
    let sentTokens: Record<string, string>;
    let subscribed = false;

    const waitForToken = async (inviteId: string) => {
      for (let i = 0; i < 50; i++) {
        if (sentTokens[inviteId]) {
          return sentTokens[inviteId];
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error(`No invite token emitted for ${inviteId}`);
    };

    const withAuth = (token: string) => ({
      headers: { ...storeHeaders.headers, Authorization: `Bearer ${token}` },
    });

    const adminInvite = async (body: Record<string, unknown>) => {
      const { data } = await api.post(
        `/admin/companies/${company.id}/invites`,
        body,
        adminHeaders
      );
      return { invite: data.invite, token: await waitForToken(data.invite.id) };
    };

    const register = async (email: string, password = "password") =>
      (
        await api.post("/auth/customer/emailpass/register", {
          email,
          password,
        })
      ).data.token as string;

    const login = async (email: string, password = "password") =>
      (await api.post("/auth/customer/emailpass", { email, password })).data
        .token as string;

    const acceptAsNewAccount = async (email: string, token: string) => {
      const registrationToken = await register(email);
      await api.post(
        `/store/employee-invites/${token}/accept`,
        { first_name: "New", last_name: "Hire" },
        withAuth(registrationToken)
      );
      return login(email);
    };

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      storeHeaders = generateStoreHeaders({ publishableKey });

      sentTokens = {};
      if (!subscribed) {
        // The container outlives each test, so only subscribe once
        container
          .resolve<IEventBusModuleService>(Modules.EVENT_BUS)
          .subscribe("employee_invite.sent", async (event: any) => {
            sentTokens[event.data.id] = event.data.token;
          });
        subscribed = true;
      }

      company = (
        await api.post(
          "/admin/companies",
          {
            name: "Acme",
            email: "acme@example.com",
            currency_code: "usd",
          },
          adminHeaders
        )
      ).data.companies[0];
    });

    describe("admin invites", () => {
      it("creates a pending invite without exposing the token hash", async () => {
        const { invite } = await adminInvite({
          email: "New.Hire@Example.com",
          first_name: "New",
          is_admin: true,
          spending_limit: 500,
        });

        expect(invite).toEqual(
          expect.objectContaining({
            email: "new.hire@example.com",
            status: "pending",
            is_admin: true,
          })
        );
        expect(invite.token_hash).toBeUndefined();

        const { data } = await api.get(
          `/admin/companies/${company.id}/invites?status=pending`,
          adminHeaders
        );
        expect(data.invites).toHaveLength(1);
        expect(data.invites[0].token_hash).toBeUndefined();

        // Requesting the hash explicitly doesn't expose it either
        const { data: withHash } = await api.get(
          `/admin/companies/${company.id}/invites?fields=+token_hash`,
          adminHeaders
        );
        expect(withHash.invites[0].id).toBe(invite.id);
        expect(withHash.invites[0].token_hash).toBeUndefined();
      });

      it("rejects a duplicate pending invite", async () => {
        await adminInvite({ email: "dup@example.com" });

        const err = await api
          .post(
            `/admin/companies/${company.id}/invites`,
            { email: "dup@example.com" },
            adminHeaders
          )
          .catch((e) => e);

        expect(err.response.status).toBe(422);
      });
    });

    describe("accepting an invite", () => {
      it("lets a new user create an account, join the company and log in", async () => {
        const { invite, token } = await adminInvite({
          email: "new@example.com",
          is_admin: true,
          spending_limit: 250,
        });

        const preview = (
          await api.get(`/store/employee-invites/${token}`, storeHeaders)
        ).data.invite;
        expect(preview).toEqual(
          expect.objectContaining({
            email: "new@example.com",
            has_account: false,
            expired: false,
            company: { name: "Acme" },
          })
        );

        const customerToken = await acceptAsNewAccount("new@example.com", token);

        const { customer } = (
          await api.get(
            "/store/customers/me?fields=*employee",
            withAuth(customerToken)
          )
        ).data;

        expect(customer).toEqual(
          expect.objectContaining({
            email: "new@example.com",
            has_account: true,
            first_name: "New",
            employee: expect.objectContaining({
              company_id: company.id,
              is_admin: true,
            }),
          })
        );

        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY);
        const {
          data: [providerIdentity],
        } = await query.graph({
          entity: "provider_identity",
          fields: ["user_metadata"],
          filters: { entity_id: "new@example.com" } as any,
        });
        expect(providerIdentity.user_metadata?.role).toBe("company_admin");

        const { data } = await api.get(
          `/admin/companies/${company.id}/invites`,
          adminHeaders
        );
        expect(data.invites).toEqual([
          expect.objectContaining({
            id: invite.id,
            status: "accepted",
            employee_id: customer.employee.id,
          }),
        ]);

        // The invite can't be reused
        const err = await api
          .post(
            `/store/employee-invites/${token}/accept`,
            {},
            withAuth(customerToken)
          )
          .catch((e) => e);
        expect(err.response.status).toBe(400);
      });

      it("links an existing storefront account after logging in", async () => {
        const { customer: existing, token: customerToken } =
          await createStoreUser({ api, storeHeaders });

        const { token } = await adminInvite({ email: "test@email.com" });

        const preview = (
          await api.get(`/store/employee-invites/${token}`, storeHeaders)
        ).data.invite;
        expect(preview.has_account).toBe(true);

        await api.post(
          `/store/employee-invites/${token}/accept`,
          {},
          withAuth(customerToken)
        );

        const { customer } = (
          await api.get(
            "/store/customers/me?fields=*employee",
            withAuth(customerToken)
          )
        ).data;

        expect(customer.id).toBe(existing.id);
        expect(customer.employee.company_id).toBe(company.id);

        // Already part of a company, so they can't be invited again
        const err = await api
          .post(
            `/admin/companies/${company.id}/invites`,
            { email: "test@email.com" },
            adminHeaders
          )
          .catch((e) => e);
        expect(err.response.status).toBe(422);
      });

      it("accepts with a login token for an identity registered by an earlier failed attempt", async () => {
        const { token } = await adminInvite({ email: "retry@example.com" });
        await register("retry@example.com");

        const loginToken = await login("retry@example.com");
        await api.post(
          `/store/employee-invites/${token}/accept`,
          {},
          withAuth(loginToken)
        );

        const { customer } = (
          await api.get(
            "/store/customers/me?fields=*employee",
            withAuth(await login("retry@example.com"))
          )
        ).data;
        expect(customer.employee.company_id).toBe(company.id);
      });

      it("rejects an identity with a different email", async () => {
        const { token } = await adminInvite({ email: "invited@example.com" });
        const registrationToken = await register("someone-else@example.com");

        const err = await api
          .post(
            `/store/employee-invites/${token}/accept`,
            {},
            withAuth(registrationToken)
          )
          .catch((e) => e);

        expect(err.response.status).toBe(400);
        expect(err.response.data.message).toContain("different email");
      });

      it("rejects revoked invites and old tokens after a resend", async () => {
        const { invite, token: firstToken } = await adminInvite({
          email: "rotate@example.com",
        });

        delete sentTokens[invite.id];
        await api.post(
          `/admin/companies/${company.id}/invites/${invite.id}/resend`,
          {},
          adminHeaders
        );
        const secondToken = await waitForToken(invite.id);
        expect(secondToken).not.toEqual(firstToken);

        const notFound = await api
          .get(`/store/employee-invites/${firstToken}`, storeHeaders)
          .catch((e) => e);
        expect(notFound.response.status).toBe(404);

        await api.delete(
          `/admin/companies/${company.id}/invites/${invite.id}`,
          adminHeaders
        );

        const registrationToken = await register("rotate@example.com");
        const err = await api
          .post(
            `/store/employee-invites/${secondToken}/accept`,
            {},
            withAuth(registrationToken)
          )
          .catch((e) => e);

        expect(err.response.status).toBe(400);
        expect(err.response.data.message).toContain("revoked");
      });
    });

    describe("storefront company admin invites", () => {
      it("allows company admins and forbids regular employees", async () => {
        const { token: adminInviteToken } = await adminInvite({
          email: "boss@example.com",
          is_admin: true,
        });
        const bossToken = await acceptAsNewAccount(
          "boss@example.com",
          adminInviteToken
        );

        const { data } = await api.post(
          `/store/companies/${company.id}/invites`,
          { email: "worker@example.com" },
          withAuth(bossToken)
        );
        const workerToken = await acceptAsNewAccount(
          "worker@example.com",
          await waitForToken(data.invite.id)
        );

        const pending = await api.get(
          `/store/companies/${company.id}/invites`,
          withAuth(bossToken)
        );
        expect(pending.status).toBe(200);

        const listErr = await api
          .get(`/store/companies/${company.id}/invites`, withAuth(workerToken))
          .catch((e) => e);
        expect(listErr.response.status).toBe(403);

        const createErr = await api
          .post(
            `/store/companies/${company.id}/invites`,
            { email: "another@example.com" },
            withAuth(workerToken)
          )
          .catch((e) => e);
        expect(createErr.response.status).toBe(400);
        expect(createErr.response.data.message).toContain("company admins");
      });

      it("only lets company admins update the company or update and remove employees", async () => {
        const { token: bossInvite } = await adminInvite({
          email: "boss@example.com",
          is_admin: true,
        });
        const bossToken = await acceptAsNewAccount("boss@example.com", bossInvite);

        const { token: workerInvite } = await adminInvite({
          email: "worker@example.com",
        });
        const workerToken = await acceptAsNewAccount(
          "worker@example.com",
          workerInvite
        );

        const { data } = await api.get(
          `/admin/companies/${company.id}/employees?fields=id,is_admin`,
          adminHeaders
        );
        const boss = data.employees.find((e) => e.is_admin);
        const worker = data.employees.find((e) => !e.is_admin);

        const updateErr = await api
          .post(
            `/store/companies/${company.id}/employees/${boss.id}`,
            { spending_limit: 1 },
            withAuth(workerToken)
          )
          .catch((e) => e);
        expect(updateErr.response.status).toBe(403);

        const deleteErr = await api
          .delete(
            `/store/companies/${company.id}/employees/${boss.id}`,
            withAuth(workerToken)
          )
          .catch((e) => e);
        expect(deleteErr.response.status).toBe(403);

        const companyUpdateErr = await api
          .post(
            `/store/companies/${company.id}`,
            { name: "Hijacked" },
            withAuth(workerToken)
          )
          .catch((e) => e);
        expect(companyUpdateErr.response.status).toBe(403);

        const companyDeleteErr = await api
          .delete(`/store/companies/${company.id}`, withAuth(workerToken))
          .catch((e) => e);
        expect(companyDeleteErr.response.status).toBe(403);

        const companyUpdated = await api.post(
          `/store/companies/${company.id}`,
          { name: "Acme Inc" },
          withAuth(bossToken)
        );
        expect(companyUpdated.status).toBe(200);

        const updated = await api.post(
          `/store/companies/${company.id}/employees/${worker.id}`,
          { spending_limit: 100 },
          withAuth(bossToken)
        );
        expect(updated.status).toBe(200);

        const deleted = await api.delete(
          `/store/companies/${company.id}/employees/${worker.id}`,
          withAuth(bossToken)
        );
        expect(deleted.status).toBe(200);
      });
    });
  },
});
