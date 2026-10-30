import Image from "next/image";
import Link from "next/link";

export function LandingHeader({ currentPage = "home" }: { currentPage?: "home" | "how-it-works" | "other" }) {
  const homeIsCurrent = currentPage === "home";
  const howItWorksIsCurrent = currentPage === "how-it-works";
  const navigationItems = [
    { label: "Inicio", href: "/#inicio", current: homeIsCurrent },
    { label: "Cómo funciona", href: "/como-funciona", current: howItWorksIsCurrent },
    { label: "Competiciones", href: "/competiciones" },
    { label: "Metodología", href: "/metodologia" },
    { label: "Contacto", href: "/contacto" },
  ];

  return (
    <header className="landing-header">
      <Link className="landing-brand" href="/" aria-label="GlorIA Futbolera, inicio">
        <Image src="/gloria-futbolera.svg" alt="" width={32} height={32} />
        <span className="landing-brand-name">GlorIA <b>Futbolera</b></span>
      </Link>
      <nav className="landing-nav" aria-label="Navegación principal">
        {navigationItems.map((item) => <Link className={item.current ? "is-current" : undefined} href={item.href} aria-current={item.current ? "page" : undefined} key={item.label}>{item.label}</Link>)}
      </nav>
      <div className="landing-actions">
        <Link className="landing-login" href="/login">Iniciar sesión</Link>
        <Link className="landing-cta landing-cta-small" href="/login?mode=register">Únete <span className="landing-cta-small-arrow" aria-hidden="true">→</span></Link>
      </div>
      <details className="landing-mobile-menu">
        <summary aria-label="Abrir o cerrar el menú" title="Menú">
          <span className="landing-menu-icon" aria-hidden="true"><i /><i /><i /></span>
        </summary>
        <nav className="landing-nav" aria-label="Navegación principal">
          {navigationItems.map((item) => <Link className={item.current ? "is-current" : undefined} href={item.href} aria-current={item.current ? "page" : undefined} key={item.label}>{item.label}</Link>)}
        </nav>
      </details>
    </header>
  );
}
