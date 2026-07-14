import { LoginForm } from "./login-form";

export const metadata = { title: "Curator access — OM-Eat" };

export default function AdminLoginPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Curator access</h1>
      <p className="mt-2 text-sm text-secondary">
        Authorised personnel only. All other users should close this page.
      </p>
      <LoginForm />
    </main>
  );
}
