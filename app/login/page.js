import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Log in · Bibliosage",
  description: "Log in to Bibliosage and pick up your learning loop.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
