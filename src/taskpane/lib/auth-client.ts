import { createAuthClient } from "better-auth/client";

// Empty baseURL — requests stay on the same origin (https://localhost:3000)
// and the webpack dev server proxy forwards /api/auth/* to http://localhost:3001
export const authClient = createAuthClient({
  baseURL: "",
});
