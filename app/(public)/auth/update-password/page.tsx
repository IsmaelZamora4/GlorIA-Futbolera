"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [sessionState, setSessionState] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams(window.location.search);
    if (query.has("error") || query.has("error_code") || query.has("error_description")) {
      const timer = window.setTimeout(() => {
        if (active) setSessionState("invalid");
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    }

    void createClient().auth.getUser().then(({ data: { user }, error: authError }) => {
      if (active) setSessionState(user && !authError ? "ready" : "invalid");
    }).catch(() => {
      if (active) setSessionState("invalid");
    });
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) {
        setError("No se pudo actualizar la contraseña. El enlace puede haber caducado; solicita uno nuevo e inténtalo otra vez.");
        return;
      }
      setComplete(true);
      setMessage("Tu contraseña se actualizó correctamente.");
    } catch {
      setError("No se pudo completar el cambio. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page password-reset-auth-page">
      <section className="auth-visual" aria-label="GlorIA Futbolera: fútbol y análisis con datos reales">
        <Image className="auth-wallpaper" src="/wallpapers/login-wallpaperr.png" alt="" fill priority unoptimized sizes="(max-width: 820px) 100vw, 56vw" />
        <div className="auth-visual-shade" aria-hidden="true" />
        <Link className="auth-visual-brand" href="/" aria-label="GlorIA Futbolera, inicio">
          <span className="auth-brand-mark"><Image src="/brand/logo-gloria.png" alt="" width={96} height={96} priority /></span>
          <span><strong>GlorIA</strong><small>FUTBOLERA</small></span>
        </Link>
        <div className="auth-hero-content">
          <div className="auth-hero-copy">
            <span className="auth-kicker">ANÁLISIS · ESTADÍSTICAS · PREDICCIONES</span>
            <h1>Vuelve al partido,<br />con <em>una clave nueva.</em></h1>
            <p>Actualiza tu contraseña y sigue explorando el fútbol con datos reales.</p>
          </div>
          <ul className="auth-feature-list" aria-label="Tu cuenta de GlorIA">
            <li><span className="auth-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2"/></svg></span><span><strong>Acceso protegido</strong><small>El enlace de recuperación verifica tu sesión antes de cambiar la clave.</small></span></li>
            <li><span className="auth-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5h16M6 16V8l6-3 6 3v8M9 16v-4h6v4"/></svg></span><span><strong>Tu espacio, como lo dejaste</strong><small>Al guardar la nueva contraseña podrás volver a tu cuenta.</small></span></li>
          </ul>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-card password-reset-card" aria-labelledby="password-reset-title">
          {complete ? (
            <>
              <div className="auth-heading"><h2 id="password-reset-title">Contraseña actualizada</h2><p role="status">{message} Ya puedes entrar a tu cuenta con la nueva contraseña.</p></div>
              <button className="auth-submit" type="button" onClick={() => router.replace("/login")}>Ir a iniciar sesión <span aria-hidden="true">→</span></button>
            </>
          ) : (
            <>
              <div className="auth-heading"><h2 id="password-reset-title">{sessionState === "invalid" ? "Enlace no válido o caducado" : "Nueva contraseña"}</h2><p>{sessionState === "invalid" ? "Solicita un nuevo enlace de recuperación para cambiar tu contraseña." : "Elige una contraseña segura para proteger tu cuenta de GlorIA Futbolera."}</p></div>
              {sessionState === "invalid" ? <Link className="auth-submit password-reset-retry" href="/login?mode=recovery">Solicitar otro enlace <span aria-hidden="true">→</span></Link> : sessionState === "checking" ? <p className="password-reset-checking" role="status">Validando el enlace de recuperación…</p> : <form className="auth-form password-reset-form" onSubmit={submit}>
                <div className="auth-field-group"><label className="auth-field-label" htmlFor="new-password">Nueva contraseña</label><div className="auth-field"><span className="auth-field-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg></span><input id="new-password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="password-reset-hint" /><button type="button" className="auth-password-toggle password-reset-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{showPassword ? <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></> : <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.2 4.1M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.8 10.8 0 0 0 5.8-1.7"/></>}</svg></button></div><small className="password-reset-hint" id="password-reset-hint">Usa al menos 8 caracteres.</small></div>
                <div className="auth-field-group"><label className="auth-field-label" htmlFor="confirm-password">Repite la nueva contraseña</label><div className="auth-field"><span className="auth-field-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg></span><input id="confirm-password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div></div>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <button className="auth-submit" type="submit" disabled={pending}>{pending ? "Actualizando contraseña…" : "Guardar nueva contraseña"}<span aria-hidden="true">→</span></button>
              </form>}
              <p className="auth-register-prompt password-reset-back">¿No solicitaste este cambio? <Link href="/login">Vuelve al inicio de sesión</Link></p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
