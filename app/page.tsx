import { redirect } from "next/navigation";

export default function home_page() {
  redirect("/login");
}