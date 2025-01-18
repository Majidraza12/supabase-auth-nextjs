import { redirect } from "next/navigation";
import { getUserSession } from "@/actions/auth";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const response = await getUserSession();
  //if user is logged in then it cannot access the login page
  if (response.status === "Success") {
    redirect("/");
  }
  return <>{children}</>;
}
