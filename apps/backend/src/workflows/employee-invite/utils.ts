import { createHash, randomBytes } from "crypto";

export const EMPLOYEE_INVITE_SENT_EVENT = "employee_invite.sent";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const hashInviteToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const generateInviteToken = () => {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    token_hash: hashInviteToken(token),
    expires_at: new Date(Date.now() + INVITE_TTL_MS),
  };
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export type InviteActor = {
  type: "customer" | "user";
  id: string;
};
