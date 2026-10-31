import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { TermsExplorer, type TermsSection } from "@/features/legal/components/TermsExplorer";
import styles from "@/features/legal/components/terms.module.css";

export const metadata: Metadata = {
  title: "Términos de uso | GlorIA Futbolera",
  description: "Condiciones de muestra para usar GlorIA Futbolera, consultar análisis y gestionar una cuenta.",
};

const sections: TermsSection[] = [
  {
    id: "introduccion",
    title: "Introducción",
    icon: "file",
    content: <><p>Te damos la bienvenida a GlorIA Futbolera. Estos términos describen el acceso y uso de este sitio y sus servicios (el «Servicio»), que permiten consultar partidos, análisis, estadísticas y estimaciones de fútbol basadas en datos.</p><p>La portada y los documentos informativos pueden consultarse públicamente. Para acceder a partidos, competiciones, metodología, análisis y otras funciones del Servicio necesitas una cuenta e iniciar sesión.</p><p>Al utilizar el Servicio, aceptas estos términos. Si no estás de acuerdo, deja de utilizar la plataforma.</p></>,
  },
  {
    id: "uso-del-servicio",
    title: "Uso del servicio",
    icon: "chart",
    content: <><p>GlorIA Futbolera ofrece información y análisis estadístico con fines informativos y de entretenimiento. El Servicio no ofrece ni acepta apuestas, no procesa pagos y no está vinculado a operadores de apuestas.</p><p>Debes utilizar la plataforma de forma lícita y responsable, sin interferir con su funcionamiento, seguridad o integridad.</p></>,
  },
  {
    id: "cuentas-de-usuario",
    title: "Cuentas de usuario",
    icon: "user",
    content: <><p>Para acceder a las secciones de uso de la plataforma necesitas una cuenta e iniciar sesión. Mi Bank y otras funciones personalizadas solo están disponibles dentro de una sesión autenticada.</p><p>Eres responsable de mantener la confidencialidad de tus credenciales y de la actividad realizada desde tu cuenta. El acceso con Google es opcional y también se rige por las políticas del proveedor.</p><p>Si detectas un uso no autorizado, comunícalo por los canales de <Link href="/contacto">contacto</Link>.</p></>,
  },
  {
    id: "contenido-y-propiedad",
    title: "Contenido y propiedad",
    icon: "shield",
    content: <><p>La marca, el diseño, el software y los textos propios de GlorIA Futbolera pertenecen a sus respectivos titulares. Estos términos no te transfieren derechos de propiedad sobre ellos.</p><p>Los nombres, escudos y datos de competiciones de terceros pertenecen a sus titulares y se muestran con fines informativos. No copies, redistribuyas ni explotes el contenido de forma que infrinja derechos ajenos o las condiciones de sus fuentes.</p></>,
  },
  {
    id: "datos-y-privacidad",
    title: "Datos y privacidad",
    icon: "database",
    content: <><p>El uso de datos de cuenta, registros de Mi Bank, cookies y almacenamiento del navegador se describe en el <Link href="/privacidad">aviso de privacidad</Link>. Consulta esa página para conocer qué información utiliza esta demostración.</p><p>Mi Bank sirve para registrar apuestas externas de forma personal. GlorIA Futbolera no recibe apuestas, no custodia dinero ni ejecuta transacciones.</p></>,
  },
  {
    id: "limitacion-de-responsabilidad",
    title: "Limitación de responsabilidad",
    icon: "warning",
    content: <><p>Las estadísticas y estimaciones son orientativas; dependen de la disponibilidad y calidad de los datos y pueden contener errores, retrasos o interrupciones. No se garantiza que el Servicio esté siempre disponible o libre de errores.</p><p>El contenido no garantiza resultados ni constituye consejo financiero o recomendación de apuesta. Cualquier decisión basada en él es responsabilidad de quien la toma.</p></>,
  },
  {
    id: "modificaciones",
    title: "Modificaciones",
    icon: "refresh",
    content: <><p>Estos términos pueden actualizarse para reflejar cambios en el Servicio o en sus funciones. La fecha de actualización aparecerá en esta página.</p><p>Si continúas utilizando el Servicio después de una actualización, se entenderá que aceptas la versión vigente.</p></>,
  },
  {
    id: "terminacion",
    title: "Terminación",
    icon: "power",
    content: <><p>Puedes dejar de utilizar el Servicio en cualquier momento. El acceso a funciones o cuentas podrá suspenderse si su uso afecta la seguridad o el funcionamiento de la plataforma.</p><p>Las opciones y el procedimiento para cerrar una cuenta deberán confirmarse antes de que este proyecto se ofrezca como un servicio operativo.</p></>,
  },
  {
    id: "legislacion-aplicable",
    title: "Legislación aplicable",
    icon: "file",
    content: <p>La jurisdicción y la legislación aplicables están pendientes de definición por el titular del proyecto. Esta sección debe completarse antes de utilizar estos términos como documento legal de un servicio público.</p>,
  },
  {
    id: "contacto",
    title: "Contacto",
    icon: "mail",
    content: <><p>Si tienes dudas sobre estos términos, visita la página de <Link href="/contacto">contacto</Link>. Los datos de contacto publicados en esta versión son de muestra y no están activos.</p><p>Este documento es un borrador para un proyecto de portafolio; el titular y la jurisdicción deben confirmarse y el texto revisarse antes de un lanzamiento real.</p></>,
  },
];

export default function TermsPage() {
  return (
    <main className="landing-page landing-page--contact">
      <LandingHeader currentPage="other" />
      <section className={`landing-hero ${styles.hero}`} aria-labelledby="terms-title">
        <div className="landing-backdrop" aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Términos de uso</p>
          <h1 id="terms-title"><span>Un uso responsable,</span><span className={styles.accent}>para una mejor experiencia.</span></h1>
          <p className={styles.intro}>Estos términos establecen las condiciones de uso de GlorIA Futbolera y las responsabilidades al utilizar el servicio.</p>
        </div>
      </section>

      <TermsExplorer sections={sections} />
      <LandingFooter />
    </main>
  );
}
