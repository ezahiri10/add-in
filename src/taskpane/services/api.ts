import type { PlaceholderVariable } from "../types/variable";

const BACKEND_URL = "";

export type FetchVariablesResult =
  | { status: "ok"; variables: PlaceholderVariable[] }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

export async function fetchVariables(): Promise<FetchVariablesResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/variables`, {
      credentials: "include",
    });

    if (res.status === 401) {
      return { status: "unauthorized" };
    }

    if (!res.ok) {
      return { status: "error", message: `Server error: ${res.status}` };
    }

    const variables: PlaceholderVariable[] = await res.json();
    return { status: "ok", variables };
  } catch {
    return { status: "error", message: "Could not reach backend. Make sure it is running on port 3001." };
  }
}
