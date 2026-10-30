import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "../../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacidad y cookies | GlorIA Futbolera",
  description: "Información de muestra sobre privacidad, cookies y almacenamiento local en GlorIA Futbolera.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacidad y cookies" description="Qué información utiliza GlorIA y cómo se relaciona con las funciones del servicio.">
      <section>
        <h2>Quién administra este proyecto</h2>
        <p><strong>Titular de ejemplo:</strong> GlorIA Futbolera, proyecto de portafolio. Antes de un lanzamiento real, esta sección debe identificar a la persona o entidad responsable y sus datos de contacto.</p>
        <p><strong>Contacto de muestra:</strong> <a href="mailto:privacidad@gloria-futbolera.example">privacidad@gloria-futbolera.example</a>. El dominio <code>.example</code> está reservado para ejemplos y no recibe mensajes.</p>
      </section>

      <section>
        <h2>Qué datos puede usar la aplicación</h2>
        <ul>
          <li><strong>Cuenta:</strong> correo, identificador de cuenta y datos necesarios para iniciar sesión. El acceso con Google es opcional.</li>
          <li><strong>Bank personal:</strong> moneda y capital inicial; evento, deporte, mercado, selección, cuota, importe, fecha y estado de apuestas que registra la persona; y ajustes de capital.</li>
          <li><strong>Almacenamiento del navegador:</strong> preferencias de idioma y tema, elecciones de algunas vistas y caché de fixtures.</li>
        </ul>
        <p>El formulario de <Link href="/contacto">Contacto</Link> es una demostración: la validación se realiza en el navegador y el mensaje no se envía ni se almacena.</p>
        <p>La portada, contacto y documentos informativos se pueden consultar sin iniciar sesión. Para acceder a partidos, competiciones, metodología, estadísticas y otras funciones de la plataforma se requiere una cuenta autenticada. El Bank guarda apuntes de apuestas externas: GlorIA no recibe apuestas ni procesa pagos.</p>
      </section>

      <section>
        <h2>Para qué se utilizan</h2>
        <p>Los datos de cuenta permiten autenticar a la persona. Los datos del Bank se usan para mostrar sus registros, saldo y rendimiento. Las preferencias y la caché ayudan a conservar ajustes y reducir consultas repetidas desde ese navegador.</p>
        <p>La base jurídica aplicable y los plazos de conservación deben definirse por el titular antes de usar esta página como aviso real.</p>
      </section>

      <section>
        <h2>Proveedores y transferencias</h2>
        <p>La versión del proyecto integra Supabase para autenticación y almacenamiento. Si la persona elige iniciar sesión con Google, también interviene Google como proveedor de autenticación. El alojamiento de la web, las regiones de almacenamiento y cualquier transferencia internacional deben confirmarse según la configuración del despliegue.</p>
      </section>

      <section id="cookies">
        <h2>Cookies y almacenamiento local</h2>
        <p>La sesión autenticada utiliza cookies necesarias para mantener el acceso. La aplicación también guarda algunas preferencias, votos y datos temporales de partidos en el almacenamiento local del navegador; este almacenamiento no es una cookie.</p>
        <p>En los archivos revisados no encontré herramientas de analítica publicitaria ni cookies de marketing. Esta descripción debe volver a comprobarse si se añaden servicios de medición, publicidad o scripts del proveedor de alojamiento.</p>
      </section>

      <section>
        <h2>Conservación y control de los datos</h2>
        <p>El plazo definitivo para conservar los datos de cuenta y del Bank está pendiente de definición. La persona debe poder solicitar acceso, rectificación o eliminación de sus datos por un canal de contacto válido, sujeto a las obligaciones legales que correspondan.</p>
        <p>Antes de publicar un aviso real, confirmar también si corresponde registrar un banco de datos personales ante la autoridad peruana y documentar las medidas de seguridad y eliminación aplicables.</p>
      </section>
    </LegalPageLayout>
  );
}
