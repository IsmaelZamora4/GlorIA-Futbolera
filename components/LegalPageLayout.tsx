import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./LegalPageLayout.module.css";

export function LegalPageLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <Link href="/" aria-label="GlorIA Futbolera, inicio">
            <Image src="/gloria-futbolera.svg" alt="" width={34} height={34} />
            <span>GlorIA Futbolera</span>
          </Link>
          <Link className={styles.homeLink} href="/">Volver al inicio</Link>
        </header>

        <article className={styles.document}>
          <h1>{title}</h1>
          <p className={styles.intro}>{description}</p>
          <aside className={styles.demoNotice} aria-label="Aviso de contenido de muestra">
            <strong>Documento de muestra para portafolio.</strong> El titular, correo y algunos detalles operativos son ejemplos. Deben confirmarse y reemplazarse antes de ofrecer el servicio al público.
          </aside>
          <div className={styles.content}>{children}</div>
          <p className={styles.updated}>Borrador de demostración · Octubre de 2026</p>
        </article>
      </div>
    </main>
  );
}
