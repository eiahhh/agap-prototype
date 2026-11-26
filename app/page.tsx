import { redirect } from "next/navigation";

// proxy.ts sends "/" to /dashboard or /login based on the session before this runs.
// This is only a fallback; /login forwards signed-in users to /dashboard anyway.
export default function home_page() {
  redirect("/login");
}
