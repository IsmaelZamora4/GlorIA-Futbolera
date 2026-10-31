import styles from "./NotFoundContent.module.css";

type NotFoundContentProps = {
  homeHref: string;
  homeLabel: string;
  matchesHref: string;
  matchesLabel: string;
  variant: "public" | "account";
};

export function NotFoundContent({ homeHref, homeLabel, matchesHref, matchesLabel, variant }: NotFoundContentProps) {
  return (
    <main className={`${styles.screen} ${styles[variant]}`}>
      <section className={styles.message} aria-labelledby="not-found-title">
        <h1 id="not-found-title">Página no encontrada</h1>
        <p>Parece que esta dirección no existe o se ha movido. Vuelve al inicio o explora las competiciones.</p>
        <nav className={styles.actions} aria-label="Opciones para continuar">
          <a className={styles.primaryAction} href={homeHref}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>
            {homeLabel}
          </a>
          <a className={styles.secondaryAction} href={matchesHref}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
            {matchesLabel}
          </a>
        </nav>
      </section>
    </main>
  );
}
