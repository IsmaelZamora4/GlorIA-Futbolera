"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/browser";

type Mode = "login" | "register" | "recovery";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setMessage(""); setPending(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : mode === "register"
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
        : await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password` });
    setPending(false);
    if (result.error) { setError(result.error.message); return; }
    if (mode === "login") {
      const requestedNext = new URLSearchParams(window.location.search).get("next");
      const destination = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
      router.push(destination);
      return;
    }
    setMessage(mode === "register" ? "Revisa tu correo para confirmar la cuenta." : "Si el correo existe, recibirás un enlace para recuperar el acceso.");
  };

  const title = mode === "login" ? "Inicia sesión" : mode === "register" ? "Crea tu cuenta" : "Recupera tu acceso";
  return <main className="auth-page"><section className="auth-card"><Link className="auth-brand" href="/">GlorIA Futbolera</Link><span className="eyebrow">Cuenta personal</span><h1>{title}</h1><p className="auth-intro">Accede a tu espacio personal para preparar el próximo bank de GlorIA.</p><form onSubmit={submit}><label>Correo<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>{mode !== "recovery" && <label>Contraseña<input type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}<button className="auth-submit" disabled={pending}>{pending ? "Procesando…" : mode === "login" ? "Entrar" : mode === "register" ? "Registrarme" : "Enviar enlace"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<div className="auth-links">{mode === "login" && <><button type="button" onClick={() => setMode("recovery")}>¿Olvidaste tu contraseña?</button><button type="button" onClick={() => setMode("register")}>Crear cuenta</button></>}{mode !== "login" && <button type="button" onClick={() => setMode("login")}>Volver a iniciar sesión</button>}</div></section></main>;
}
