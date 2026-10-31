"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const supabase = createClient();

export function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setEmail(data.user?.email ?? null);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setEmail(session?.user.email ?? null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (!email) return <Link className="auth-nav-link" href="/login">Iniciar sesión</Link>;

  return (
    <div className="auth-nav">
      <span className="auth-nav-email" title={email}>{email}</span>
      <button className="auth-nav-logout" type="button" onClick={() => void supabase.auth.signOut().then(() => router.push("/"))}>
        Salir
      </button>
    </div>
  );
}
