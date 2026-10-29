"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "../../../lib/supabase/browser";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (updateError) setError(updateError.message); else setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
  };
  return <main className="auth-page"><section className="auth-card"><Link className="auth-brand" href="/">GlorIA Futbolera</Link><span className="eyebrow">Seguridad</span><h1>Nueva contraseña</h1><p className="auth-intro">Elige una contraseña nueva para tu cuenta.</p><form onSubmit={submit}><label>Contraseña<input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="auth-submit" disabled={pending}>{pending ? "Guardando…" : "Guardar contraseña"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}</section></main>;
}
