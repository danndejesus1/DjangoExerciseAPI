// TEAMFPSCRUDDjangoReact/src/api.ts
const API_BASE = (import.meta.env?.VITE_API_BASE as string) || "http://127.0.0.1:8000";

async function apiFetch(path: string, opts: RequestInit = {}, token?: string) {
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };
  if (token) headers["Authorization"] = `Token ${token}`;
  if (opts.body && !(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, credentials: "omit" });
  return res;
}

export type Subject = { id: number | string; name: string };
export type Student = { id: number | string; email: string; first_name?: string; last_name?: string; is_staff?: boolean; is_admin?: boolean };

// Subjects
export async function fetchSubjects(token?: string) {
  const r = await apiFetch("/api/subjects/", { method: "GET" }, token);
  if (!r.ok) throw r;
  return r.json() as Promise<Subject[]>;
}
export async function createSubject(payload: { name: string }, token?: string) {
  const r = await apiFetch("/api/subjects/", { method: "POST", body: JSON.stringify(payload) }, token);
  if (!r.ok) throw r;
  return r.json() as Promise<Subject>;
}
export async function deleteSubject(id: string | number, token?: string) {
  const r = await apiFetch(`/api/subjects/${id}/`, { method: "DELETE" }, token);
  if (!r.ok && r.status !== 204) throw r;
  return r;
}

// Users
export async function fetchUsers(token?: string) {
  const r = await apiFetch("/api/users/", { method: "GET" }, token);
  if (!r.ok) throw r;
  return r.json() as Promise<Student[]>;
}
export async function createUser(payload: { email: string; password: string; first_name?: string; last_name?: string }, token?: string) {
  const r = await apiFetch("/api/users/", { method: "POST", body: JSON.stringify(payload) }, token);
  if (!r.ok) throw r;
  return r.json() as Promise<Student>;
}
export async function deleteUser(id: string | number, token?: string) {
  const r = await apiFetch(`/api/users/${id}/`, { method: "DELETE" }, token);
  if (!r.ok && r.status !== 204) throw r;
  return r;
}