import { randomBytes } from "node:crypto";

const SHARE_TOKEN_BYTES = 12;

export function generateShareToken() {
  return randomBytes(SHARE_TOKEN_BYTES).toString("base64url");
}
