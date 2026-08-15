export const ADMIN_SECRET_HEADER = "x-shopfy-admin-secret";

export function isValidAdminSecret(secret?: string | null) {
  const adminSecret = process.env.ADMIN_SECRET;
  return Boolean(adminSecret && secret && secret === adminSecret);
}

export function getAdminSecretFromRequest(request: Request) {
  return request.headers.get(ADMIN_SECRET_HEADER) || "";
}
