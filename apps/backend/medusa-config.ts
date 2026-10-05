import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const isTest = process.env.NODE_ENV === "test";

// Tests never send real emails; they go to the local provider (console) instead.
const useResend = !isTest && !!process.env.RESEND_API_KEY;
// Tests stay in-memory so they never share Redis (queues, events) with a
// running dev server.
const redisUrl = isTest ? undefined : process.env.REDIS_URL;

// Without a Redis URL, Medusa falls back to in-memory event bus, workflow
// engine, locking and cache.
const redisModules: Record<
  string,
  { resolve: string; options: Record<string, unknown> }
> = redisUrl
  ? {
      [Modules.EVENT_BUS]: {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl },
      },
      [Modules.WORKFLOW_ENGINE]: {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { redisUrl } },
      },
      [Modules.LOCKING]: {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl },
            },
          ],
        },
      },
      [Modules.CACHE]: {
        resolve: "@medusajs/medusa/cache-redis",
        options: { redisUrl },
      },
    }
  : {};

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: {
    ...redisModules,
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },
    [Modules.NOTIFICATION]: {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              // Without Resend, emails are logged to the console in development
              channels: useResend ? ["feed"] : ["feed", "email"],
            },
          },
          ...(useResend
            ? [
                {
                  resolve: "./src/modules/resend",
                  id: "resend",
                  options: {
                    channels: ["email"],
                    api_key: process.env.RESEND_API_KEY,
                    from: process.env.RESEND_FROM_EMAIL,
                    test_recipient: process.env.RESEND_TEST_RECIPIENT,
                  },
                },
              ]
            : []),
        ],
      },
    },
  },
});
