"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/browser";
import { getSafeInternalPath } from "../../lib/auth/redirect";

type Mode = "login" | "register" | "recovery";

function getRequestedDestination() {
  return getSafeInternalPath(new URLSearchParams(window.location.search).get("next"), window.location.origin);
}

function getAuthCallbackUrl(next: string) {
  const callback = new URL("/auth/callback", window.location.origin);
  callback.searchParams.set("next", next);
  return callback.toString();
}

export default function LoginPage() {
  return <Suspense fallback={<main className="auth-page" aria-busy="true" />}><LoginForm /></Suspense>;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "register" ? "register" : "login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("auth_error") === "callback") {
      const timer = window.setTimeout(() => {
        setError("No se pudo validar el enlace. Solicita uno nuevo e inténtalo otra vez.");
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [searchParams]);

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  const continueWithGoogle = async () => {
    setError("");
    setMessage("");
    setPending(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAuthCallbackUrl(getRequestedDestination()) },
      });
      if (oauthError) setError("No se pudo conectar con Google. Inténtalo de nuevo.");
    } catch {
      setError("No se pudo conectar con Google. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (mode === "register") {
      const normalizedName = name.trim();
      const normalizedUsername = username.trim().toLowerCase();
      if (normalizedName.length < 2 || normalizedName.length > 80) {
        setError("El nombre debe tener entre 2 y 80 caracteres.");
        return;
      }
      if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
        setError("El username debe tener entre 3 y 20 caracteres: letras, números o guion bajo.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }
    setPending(true);
    const redirectTo = getAuthCallbackUrl(getRequestedDestination());
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : mode === "register"
          ? await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: {
                emailRedirectTo: redirectTo,
                data: { name: name.trim(), full_name: name.trim(), username: username.trim().toLowerCase() },
              },
            })
          : await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getAuthCallbackUrl("/auth/update-password") });
      if (result.error) {
        setError(mode === "login"
          ? "No se pudo iniciar sesión. Revisa tu correo y contraseña."
          : mode === "register"
            ? "No se pudo crear la cuenta. Revisa los datos o intenta con otro correo."
            : "No se pudo enviar el enlace. Inténtalo de nuevo más tarde.");
        return;
      }
      if (mode === "login") {
        router.replace(getRequestedDestination());
        return;
      }
      setMessage(mode === "register" ? "Revisa tu correo para confirmar la cuenta." : "Si el correo existe, recibirás un enlace para recuperar el acceso.");
    } catch {
      setError("No se pudo completar la solicitud. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  };

  const isLogin = mode === "login";
  const title = isLogin ? "Inicia sesión" : mode === "register" ? "Crea tu cuenta" : "Recupera tu acceso";
  const description = isLogin
    ? "Inicia sesión para acceder a partidos, competiciones, metodología y análisis de GlorIA Futbolera."
    : mode === "register"
      ? "Crea tu cuenta para guardar tu progreso y preparar tu espacio personal."
      : "Te enviaremos un enlace para que puedas recuperar el acceso a tu cuenta.";

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="GlorIA Futbolera: fútbol y análisis con datos reales">
        <Image className="auth-wallpaper" src="/login-wallpaperr.png" alt="" fill priority unoptimized sizes="(max-width: 820px) 100vw, 56vw" />
        <div className="auth-visual-shade" />
        <Link className="auth-visual-brand" href="/" aria-label="GlorIA Futbolera, inicio">
          <span className="auth-brand-mark"><Image src="/logo-gloria.png" alt="" width={96} height={96} priority /></span>
          <span><strong>GlorIA</strong><small>FUTBOLERA</small></span>
        </Link>
        <div className="auth-hero-content">
          <div className="auth-hero-copy">
            <span className="auth-kicker">ANÁLISIS · ESTADÍSTICAS · PREDICCIONES</span>
            <h1 aria-label="El fútbol, con datos reales.">El fútbol,<br />con <em>datos reales.</em></h1>
            <p>Inicia sesión para entrar a los partidos, análisis y demás secciones de la plataforma.</p>
          </div>
          <ul className="auth-feature-list" aria-label="Lo que encontrarás en GlorIA Futbolera">
            <li>
              <span className="auth-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg></span>
              <span><strong>Partidos del día</strong><small>Consulta los encuentros de las principales ligas.</small></span>
            </li>
            <li>
              <span className="auth-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5h16M6 16V8l6-3 6 3v8M9 16v-4h6v4" /></svg></span>
              <span><strong>Datos para analizar</strong><small>Explora métricas y tendencias de cada partido.</small></span>
            </li>
            <li>
              <span className="auth-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg></span>
              <span><strong>Tus competiciones</strong><small>Sigue Liga 1 y los torneos más importantes de Europa.</small></span>
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">
          <header className="auth-heading">
            <h2>{title}</h2>
            <p>{description}</p>
          </header>

          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && <>
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-name">Nombre</label>
                <div className="auth-field"><span className="auth-field-icon" aria-hidden="true"><UserIcon /></span><input id="auth-name" type="text" required minLength={2} maxLength={80} autoComplete="name" placeholder="Tu nombre" value={name} onChange={(event) => setName(event.target.value)} /></div>
              </div>
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-username">Username</label>
                <div className="auth-field"><span className="auth-field-icon" aria-hidden="true"><AtIcon /></span><input id="auth-username" type="text" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" autoComplete="username" placeholder="Elige un username" value={username} onChange={(event) => setUsername(event.target.value)} aria-describedby="username-help" /></div>
              </div>
              <span className="sr-only" id="username-help">De 3 a 20 caracteres: letras, números o guion bajo.</span>
            </>}
            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="auth-email">Correo electrónico</label>
              <div className="auth-field"><span className="auth-field-icon" aria-hidden="true"><MailIcon /></span><input id="auth-email" type="email" required maxLength={254} autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            </div>
            {mode !== "recovery" && <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="auth-password">Contraseña</label>
              <div className="auth-field"><span className="auth-field-icon" aria-hidden="true"><LockIcon /></span><input id="auth-password" type={showPassword ? "text" : "password"} required minLength={mode === "register" ? 8 : 6} maxLength={72} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="Escribe tu contraseña" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}><EyeIcon hidden={!showPassword} /></button></div>
            </div>}
            {mode === "register" && <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="auth-confirm-password">Confirmar contraseña</label>
              <div className="auth-field"><span className="auth-field-icon" aria-hidden="true"><LockIcon /></span><input id="auth-confirm-password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Repite tu contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
            </div>}

            {isLogin && <div className="auth-options"><span><LockIcon /> Sesión protegida</span><button type="button" onClick={() => changeMode("recovery")}>¿Olvidaste tu contraseña?</button></div>}
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? "Procesando…" : isLogin ? "Iniciar sesión" : mode === "register" ? "Crear cuenta" : "Enviar enlace"}
              {!pending && <span aria-hidden="true">→</span>}
            </button>
          </form>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}

          {mode !== "recovery" && <>
            <div className="auth-divider"><span>O CONTINÚA CON</span></div>
            <button className="auth-google" type="button" onClick={continueWithGoogle} disabled={pending}>
              <GoogleIcon />
              {pending ? "Conectando con Google…" : "Continuar con Google"}
            </button>
          </>}
          {mode === "recovery" && <div className="auth-divider"><span>GLORIA FUTBOLERA</span></div>}
          <p className="auth-secure-note"><LockIcon /> Tu cuenta y tus datos están protegidos.</p>
          <p className="auth-register-prompt">
            {mode === "register" ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
            <button type="button" onClick={() => changeMode(mode === "register" ? "login" : "register")}>
              {mode === "register" ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>
        <Link className="auth-back-home" href="/">← Volver a GlorIA Futbolera</Link>
      </section>
    </main>
  );
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}

function AtIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M16 12a4 4 0 1 1-1.2-2.8V13a2 2 0 0 0 4 0v-1" /></svg>;
}

function GoogleIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.06 46.98 31.92 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" />{hidden && <path d="m3 3 18 18" />}</svg>;
}
