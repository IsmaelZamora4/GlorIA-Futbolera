import Link from "next/link";
import { redirect } from "next/navigation";
import { AppSidebar } from "../../components/AppSidebar";
import { createClient } from "../../lib/supabase/server";

export default async function BankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bank");

  return <div className="app-shell"><AppSidebar active="Mi Bank" /><main className="main-area"><header className="topbar"><div className="methodology-topbar-title"><span className="eyebrow">Espacio privado</span><strong>Mi Bank</strong></div><div className="top-actions"><Link className="methodology-topbar-link" href="/">Volver al análisis <span aria-hidden="true">→</span></Link></div></header><div className="bank-page"><span className="eyebrow">Bank personal</span><h1>Tu control empieza aquí.</h1><p>Esta sección será tu espacio privado para registrar apuestas, consultar saldo y medir tu rendimiento.</p><div className="bank-coming-soon"><strong>Próximamente</strong><span>Primero configuraremos tu moneda base: soles, dólares o euros.</span></div></div></main></div>;
}
