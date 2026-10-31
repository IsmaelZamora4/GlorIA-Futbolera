"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { removeAvatar, saveAvatarPath, saveProfileDetails } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/browser";

const competitions = ["Liga 1", "Premier League", "Serie A", "LaLiga", "Ligue 1", "Bundesliga", "Champions League", "Europa League"];
const timezones = [
  ["America/Lima", "Lima · UTC−5"],
  ["America/Bogota", "Bogotá · UTC−5"],
  ["America/Argentina/Buenos_Aires", "Buenos Aires · UTC−3"],
  ["Europe/Madrid", "Madrid · UTC+1"],
];
const maxAvatarSize = 2 * 1024 * 1024;
const allowedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProfileSettingsData = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  timezone: string;
  favorites: string[];
  loadError: string | null;
};

export function ProfileSettings({ profile }: { profile: ProfileSettingsData }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [favorites, setFavorites] = useState(profile.favorites);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [pending, setPending] = useState(false);
  const [avatarPending, setAvatarPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  function toggleFavorite(competition: string) {
    setFavorites((current) => current.includes(competition)
      ? current.filter((item) => item !== competition)
      : [...current, competition]);
  }

  async function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.set("displayName", displayName);
    formData.set("timezone", timezone);
    favorites.forEach((favorite) => formData.append("favorites", favorite));
    const result = await saveProfileDetails(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setMessage(result.success ?? "Perfil actualizado.");
      router.refresh();
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    if (!allowedAvatarTypes.has(file.type)) {
      setError("Elige una imagen JPEG, PNG o WebP.");
      return;
    }
    if (file.size > maxAvatarSize) {
      setError("La imagen no puede superar los 2 MB.");
      return;
    }

    setAvatarPending(true);
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setAvatarPending(false);
      setError("Tu sesión ha caducado. Inicia sesión de nuevo.");
      return;
    }
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const path = `${user.id}/avatar-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      setAvatarPending(false);
      setError(uploadError.message.toLowerCase().includes("size") ? "La imagen no puede superar los 2 MB." : "No se pudo subir la imagen. Comprueba que la migración de perfiles esté aplicada.");
      return;
    }
    const result = await saveAvatarPath(path);
    if (result.error) {
      await supabase.storage.from("profile-avatars").remove([path]);
      setAvatarPending(false);
      setError(result.error);
      return;
    }
    setAvatarUrl(supabase.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl);
    setAvatarPending(false);
    setMessage("Foto de perfil actualizada.");
    router.refresh();
  }

  async function clearAvatar() {
    setAvatarPending(true);
    setError("");
    const result = await removeAvatar();
    setAvatarPending(false);
    if (result.error) setError(result.error);
    else {
      setAvatarUrl(null);
      setMessage("Se quitó la foto de perfil.");
      router.refresh();
    }
  }

  async function requestPasswordChange() {
    setPasswordPending(true);
    setError("");
    setPasswordMessage("");
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    setPasswordPending(false);
    if (resetError) setError("No se pudo enviar el enlace para cambiar la contraseña.");
    else setPasswordMessage("Enviamos un enlace de cambio de contraseña a tu correo.");
  }

  const registeredDate = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "UTC" }).format(new Date(profile.createdAt));
  const initials = displayName.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("es-PE") || "U";

  return <div className="profile-content">
    <section className="profile-identity" aria-label="Identidad de la cuenta">
      <div className="profile-avatar" aria-hidden="true">{avatarUrl ? <Image src={avatarUrl} alt="" width={84} height={84} unoptimized /> : <span>{initials}</span>}</div>
      <div className="profile-identity-copy"><h2>{displayName}</h2><p>{profile.email}</p><span>Miembro desde {registeredDate}</span></div>
      <div className="profile-avatar-actions"><button type="button" onClick={() => fileInput.current?.click()} disabled={avatarPending}>{avatarPending ? "Subiendo…" : avatarUrl ? "Cambiar foto" : "Subir foto"}</button>{avatarUrl && <button className="profile-text-button" type="button" onClick={clearAvatar} disabled={avatarPending}>Quitar</button>}<input ref={fileInput} className="profile-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} aria-label="Subir foto de perfil" /><small>JPEG, PNG o WebP · máximo 2 MB</small></div>
    </section>

    {profile.loadError && <p className="profile-alert" role="alert">{profile.loadError}</p>}
    <form className="profile-section-grid" onSubmit={submitDetails}>
      <section className="profile-section profile-personal-section"><div className="profile-section-heading"><div><h2>Datos personales</h2><p>Tu correo se muestra como dato de acceso y no se puede cambiar aquí.</p></div></div><label>Nombre y apellido<input autoComplete="name" maxLength={80} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label>Correo electrónico<input type="email" value={profile.email} readOnly disabled /></label></section>
      <section className="profile-section profile-preferences-section"><div className="profile-section-heading"><div><h2>Preferencias</h2><p>Configura tu zona horaria y las ligas que sigues.</p></div></div><label>Zona horaria<select value={timezone} onChange={(event) => setTimezone(event.target.value)}>{timezones.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><fieldset className="profile-favorites"><legend>Ligas favoritas</legend><div>{competitions.map((competition) => <label key={competition}><input type="checkbox" checked={favorites.includes(competition)} onChange={() => toggleFavorite(competition)} />{competition}</label>)}</div></fieldset></section>
      <div className="profile-form-actions"><button type="submit" disabled={pending || Boolean(profile.loadError)}>{pending ? "Guardando…" : "Guardar cambios"}</button>{message && <p role="status">{message}</p>}{error && <p className="profile-error" role="alert">{error}</p>}</div>
    </form>

    <section className="profile-section profile-security-section"><div className="profile-section-heading"><div><h2>Seguridad</h2><p>Solicita un enlace seguro para cambiar la contraseña de tu cuenta.</p></div><button type="button" onClick={requestPasswordChange} disabled={passwordPending || !profile.email}>{passwordPending ? "Enviando…" : "Enviar enlace"}</button></div>{passwordMessage && <p className="profile-success" role="status">{passwordMessage}</p>}</section>
  </div>;
}
