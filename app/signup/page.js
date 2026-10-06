import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Sign up · Bibliosage",
  description: "Create your Bibliosage account and start learning.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
