import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { useAuth } from "../context/useAuth";

function LoginPage() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const handleSignIn = async () => {
    resetMessages();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async () => {
    resetMessages();
    if (!name || !email || !password) {
      setError("Name, email and password are required.");
      return;
    }
    setBusy(true);
    try {
      await register({ name, email, password });
      setInfo("Account created — you can sign in now.");
      setMode("signin");
      setPassword("");
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (mode === "signin") handleSignIn();
    else handleSignUp();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Glow Behind Panel */}
      <div className="pointer-events-none absolute h-[32rem] w-[32rem] rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="af-glass w-full max-w-sm rounded-2xl p-8 border border-white/10 shadow-2xl relative">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-display text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25">
            NK
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-white">NexusKeep</h1>
          <p className="mt-1.5 text-xs text-slate-400 font-medium">
            {mode === "signin"
              ? "Sign in to manage your organization's assets"
              : "Create a fresh employee account"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Name</span>
              <InputText
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Email</span>
            <InputText
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full"
              type="email"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Password</span>
            <Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              toggleMask
              feedback={false}
              inputClassName="w-full"
              className="w-full"
            />
          </label>

          {error && <Message severity="error" text={error} className="w-full justify-start !bg-rose-500/10 border border-rose-500/20 text-rose-300" />}
          {info && <Message severity="success" text={info} className="w-full justify-start !bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" />}

          {mode === "signin" ? (
            <>
              <div className="text-right">
                <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition">
                  Forgot password
                </button>
              </div>
              <Button type="submit" label="Sign in" loading={busy} className="w-full justify-center" />
            </>
          ) : (
            <Button type="submit" label="Create account" loading={busy} className="w-full justify-center" />
          )}
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {mode === "signin" ? "New here" : "Already have an account"}
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {mode === "signin" ? (
          <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 text-[11px] text-slate-500 font-semibold leading-relaxed">
            Signing up creates an Employee account. Roles like Department Head or Asset Manager must be promoted by an Admin.
          </div>
        ) : null}

        <Button
          label={mode === "signin" ? "Create Account" : "Back to Sign In"}
          outlined
          className="mt-3.5 w-full justify-center"
          onClick={() => {
            resetMessages();
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        />
      </div>
    </div>
  );
}

export default LoginPage;
