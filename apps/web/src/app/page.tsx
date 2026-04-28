import { redirect } from "next/navigation";

export default function Home() {
  // Preserve the existing homepage UX/SEO during migration.
  redirect("/healthrankings-homepage.html");
}
