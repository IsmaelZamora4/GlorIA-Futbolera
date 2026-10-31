import { SportiaSidebar } from "@/components/layout/SportiaSidebar";
import { SportiaPageHeader } from "@/components/layout/SportiaPageHeader";
import { NotFoundContent } from "@/features/not-found/components/NotFoundContent";
import styles from "@/features/not-found/components/NotFoundContent.module.css";

export default function HomeNotFound() {
  return (
    <div className="sportia-home">
      <SportiaSidebar />
      <div className={`sportia-main ${styles.accountLayout}`}>
        <SportiaPageHeader title="404" description="Página no encontrada" />
        <NotFoundContent
          homeHref="/home"
          homeLabel="Volver a mi home"
          matchesHref="/home/partidos"
          matchesLabel="Ver partidos"
          variant="account"
        />
      </div>
    </div>
  );
}
