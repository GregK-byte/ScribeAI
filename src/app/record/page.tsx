import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import RecordClient from "./RecordClient";

export default async function RecordPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return <RecordClient userId={userId} />;
}
