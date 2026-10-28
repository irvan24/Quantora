import { api, type AuthUser } from "@/lib/auth";

export async function updateProfile(firstName: string, lastName: string) {
  return api<AuthUser>("/api/users/me", {
    method: "PUT",
    body: JSON.stringify({ firstName, lastName }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return api<void>("/api/users/me/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteAccount(password: string) {
  return api<void>("/api/users/me", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}
