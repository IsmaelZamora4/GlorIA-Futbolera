import Image from "next/image";
import Link from "next/link";

export function LandingHeader({ currentPage = "home" }: { currentPage?: "home" | "how-it-works" | "other" }) {
  const homeIsCurrent = currentPage === "home";
  const howItWorksIsCurrent = currentPage === "how-it-works";

  return (
    <header className="landing-header">
      <Link className="landing-brand" href="/" aria-label="GlorIA Futbolera, inicio">
        <Image src="/gloria-futbolera.svg" alt="" width={32} height={32} />
        <span>GlorIA <b>Futbolera</b></span>
      </Link>
      <nav className="landing-nav" aria-label="Navegación principal">
        <Link className={homeIsCurrent ? "is-current" : undefined} href="/#inicio" aria-current={homeIsCurrent ? "page" : undefined}>Inicio</Link>
        <Link className={howItWorksIsCurrent ? "is-current" : undefined} href="/como-funciona" aria-current={howItWorksIsCurrent ? "page" : undefined}>Cómo funciona</Link>
        <Link href="/competiciones">Competiciones</Link>
        <Link href="/metodologia">Metodología</Link>
        <Link href="/contacto">Contacto</Link>
      </nav>
      <div className="landing-actions">
        <Link className="landing-login" href="/login">Iniciar sesión</Link>
        <Link className="landing-cta landing-cta-small" href="/login?mode=register">Únete <span className="landing-cta-small-arrow" aria-hidden="true">→</span></Link>
      </div>
    </header>
  );
}
