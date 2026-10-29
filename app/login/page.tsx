"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
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
            <label className="auth-field">
              <span className="auth-field-icon" aria-hidden="true"><MailIcon /></span>
              <span className="sr-only">Correo electrónico</span>
              <input type="email" required autoComplete="email" placeholder="Correo electrónico" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            {mode !== "recovery" && <label className="auth-field">
              <span className="auth-field-icon" aria-hidden="true"><LockIcon /></span>
              <span className="sr-only">Contraseña</span>
              <input type={showPassword ? "text" : "password"} required minLength={6} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}><EyeIcon hidden={!showPassword} /></button>
            </label>}

            {isLogin && <div className="auth-options"><span><LockIcon /> Sesión protegida</span><button type="button" onClick={() => changeMode("recovery")}>¿Olvidaste tu contraseña?</button></div>}
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? "Procesando…" : isLogin ? "Iniciar sesión" : mode === "register" ? "Crear cuenta" : "Enviar enlace"}
              {!pending && <span aria-hidden="true">→</span>}
            </button>
          </form>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}

          <div className="auth-divider"><span>{isLogin ? "ACCESO SEGURO" : "GLORIA FUTBOLERA"}</span></div>
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

function LockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" />{hidden && <path d="m3 3 18 18" />}</svg>;
}
