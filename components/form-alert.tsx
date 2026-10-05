const messages: Record<string, string> = {
  invalid: "That email and password don't match an account.",
  rate: "Too many attempts. Please wait a few minutes and try again.",
  missing: "Please fill in your name, email, and password.",
  email: "Please enter a valid email address.",
  password: "Your password needs at least 8 characters.",
  exists: "An account with that email already exists. Try signing in instead."
};

export function FormAlert({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {messages[code] ?? "Something went wrong. Please try again."}
    </p>
  );
}
