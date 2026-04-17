export const ADMIN_EMAIL = "admin@navihub.com";

export const isAdminEmail = (email?: string | null) =>
  (email ?? "").toLowerCase() === ADMIN_EMAIL;