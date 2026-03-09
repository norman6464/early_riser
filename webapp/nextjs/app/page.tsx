import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to editor page
  redirect("/editor");
}
