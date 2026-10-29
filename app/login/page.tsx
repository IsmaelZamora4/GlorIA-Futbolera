"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/browser";

type Mode = "login" | "register" | "recovery";

const competitions = [
  ["Premier League", "/competitions/premier-league.svg"],
  ["LaLiga", "/competitions/laliga.svg"],
  ["Serie A", "/competitions/serie-a.svg"],
  ["Bundesliga", "/competitions/bundesliga.svg"],
  ["Ligue 1", "/competitions/ligue-1.svg"],
  ["Champions League", "/competitions/champions-league.svg"],
  ["Europa League", "/competitions/europa-league.svg"],
];

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
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
    if (new URLSearchParams(window.location.search).get("auth_error") === "callback") {
      const timer = window.setTimeout(() => {
        setError("No se pudo validar el enlace. Solicita uno nuevo e inténtalo otra vez.");
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

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
        options: { redirectTo: `${window.location.origin}/auth/callback` },
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
    const redirectTo = `${window.location.origin}/auth/callback`;
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
          : await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password` });
      if (result.error) {
        setError(mode === "login"
          ? "No se pudo iniciar sesión. Revisa tu correo y contraseña."
          : mode === "register"
            ? "No se pudo crear la cuenta. Revisa los datos o intenta con otro correo."
            : "No se pudo enviar el enlace. Inténtalo de nuevo más tarde.");
        return;
      }
      if (mode === "login") {
        const requestedNext = new URLSearchParams(window.location.search).get("next");
        const destination = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
        router.push(destination);
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
    ? "Accede a tu cuenta para continuar con tus análisis, pronósticos y estadísticas personalizadas."
    : mode === "register"
      ? "Crea tu cuenta para guardar tu progreso y preparar tu espacio personal."
      : "Te enviaremos un enlace para que puedas recuperar el acceso a tu cuenta.";

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="GlorIA Futbolera: fútbol y análisis con datos reales">
        <Image className="auth-wallpaper" src="/login-wallpaper.webp" alt="Balón de fútbol en un estadio iluminado" fill priority sizes="(max-width: 760px) 100vw, 49vw" />
        <div className="auth-visual-shade" />
        <Link className="auth-visual-brand" href="/" aria-label="GlorIA Futbolera, inicio">
          <span className="auth-brand-mark"><Image src="/logo-gloria.png" alt="" width={96} height={96} priority /></span>
          <span><strong>GlorIA</strong><small>FUTBOLERA</small></span>
        </Link>
        <div className="auth-hero-copy">
          <span className="auth-kicker">ANÁLISIS · ESTADÍSTICAS · PREDICCIONES</span>
          <h1 aria-label="El fútbol, con datos reales.">El fútbol,<br />con <em>datos reales.</em></h1>
          <p>Accede a tu cuenta y continúa analizando<br className="auth-desktop-break" /> las principales ligas del mundo.</p>
        </div>
        <ul className="auth-competitions" aria-label="Competiciones disponibles">
          {competitions.map(([name, src]) => <li key={name}><Image src={src} alt="" width={24} height={24} /><span>{name}</span></li>)}
        </ul>
        <span className="auth-visual-footnote">DATOS PARA ENTENDER MEJOR EL JUEGO</span>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">
          <Link className="auth-card-brand" href="/" aria-label="GlorIA Futbolera, inicio">
            <span className="auth-brand-mark"><Image src="/logo-gloria.png" alt="" width={96} height={96} priority /></span>
            <span><strong>GlorIA</strong><small>FUTBOLERA</small></span>
          </Link>
          <header className="auth-heading">
            <h2>{title}</h2>
            <p>{description}</p>
          </header>

          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && <>
              <label className="auth-field">
                <span className="auth-field-icon" aria-hidden="true"><UserIcon /></span>
                <span className="sr-only">Nombre</span>
                <input type="text" required minLength={2} maxLength={80} autoComplete="name" placeholder="Nombre" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="auth-field">
                <span className="auth-field-icon" aria-hidden="true"><AtIcon /></span>
                <span className="sr-only">Username</span>
                <input type="text" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" autoComplete="username" placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} aria-describedby="username-help" />
              </label>
              <span className="sr-only" id="username-help">De 3 a 20 caracteres: letras, números o guion bajo.</span>
            </>}
            <label className="auth-field">
              <span className="auth-field-icon" aria-hidden="true"><MailIcon /></span>
              <span className="sr-only">Correo electrónico</span>
              <input type="email" required maxLength={254} autoComplete="email" placeholder="Correo electrónico" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            {mode !== "recovery" && <label className="auth-field">
              <span className="auth-field-icon" aria-hidden="true"><LockIcon /></span>
              <span className="sr-only">Contraseña</span>
              <input type={showPassword ? "text" : "password"} required minLength={mode === "register" ? 8 : 6} maxLength={72} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}><EyeIcon hidden={!showPassword} /></button>
            </label>}
            {mode === "register" && <label className="auth-field">
              <span className="auth-field-icon" aria-hidden="true"><LockIcon /></span>
              <span className="sr-only">Confirmar contraseña</span>
              <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>}

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
