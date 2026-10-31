import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/features/contact/components/ContactForm";
import { ContactIcon } from "@/features/contact/components/ContactIcon";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { LandingHeader } from "@/components/layout/LandingHeader";
import styles from "@/features/contact/components/contacto.module.css";

export const metadata: Metadata = {
  title: "Contacto | GlorIA Futbolera",
  description: "Información de contacto y respuestas a preguntas frecuentes sobre GlorIA Futbolera.",
};

const questions = [
  {
    question: "¿Puedo usar GlorIA Futbolera gratis?",
    answer: "Sí. Las páginas públicas de partidos, competiciones y análisis se pueden consultar sin pagar.",
  },
  {
    question: "¿Es necesario crear una cuenta?",
    answer: "Sí. Para acceder a partidos, competiciones, metodología y otras secciones de la plataforma necesitas iniciar sesión.",
  },
  {
    question: "¿Qué tipo de consultas puedo enviar?",
    answer: "En una versión operativa, puedes comunicar dudas, sugerencias o problemas técnicos.",
  },
];

export default function ContactPage() {
  return (
    <main className="landing-page landing-page--contact">
      <LandingHeader currentPage="other" />
      <section className={`landing-hero ${styles.hero}`} aria-labelledby="contact-title">
        <div className="landing-backdrop" aria-hidden="true" />
        <div className={styles.content}>
          <p className={styles.eyebrow}>Contacto</p>
          <h1 id="contact-title"><span>Hablemos.</span><span className={styles.accent}>Estamos aquí para ayudarte.</span></h1>
          <p className={styles.intro}>Si tienes dudas, sugerencias o encuentras algún problema, puedes contactar con el equipo de GlorIA Futbolera. Te responderemos lo antes posible.</p>
        </div>
      </section>
      <section className={styles.contactBody} aria-label="Información y formulario de contacto">
        <div className={styles.columns}>
          <div className={styles.leftColumn}>
            <section className={`${styles.card} ${styles.infoCard}`} aria-labelledby="contact-info-title">
              <h2 id="contact-info-title">Información de contacto</h2>
              <p className={styles.cardIntro}>Canales de muestra; el correo aún no está activo.</p>
              <div className={styles.contactMethods}>
                <div className={styles.contactMethod}>
                  <span className={styles.contactIcon}><ContactIcon name="mail" /></span>
                  <div><h3>Correo electrónico</h3><p>Para consultas generales, soporte o sugerencias.</p><span className={styles.sampleEmail}>contacto@gloria-futbolera.example</span></div>
                </div>
                <div className={styles.contactMethod}>
                  <span className={styles.contactIcon}><ContactIcon name="chat" /></span>
                  <div><h3>Tiempo de respuesta</h3><p>El plazo de 24–48 horas es referencial para este proyecto de portafolio.</p></div>
                </div>
                <div className={styles.contactMethod}>
                  <span className={styles.contactIcon}><ContactIcon name="shield" /></span>
                  <div><h3>Privacidad</h3><p>El formulario de esta demostración no envía ni guarda tus datos.</p><Link className={styles.textLink} href="/privacidad">Ver aviso de privacidad <span aria-hidden="true">→</span></Link></div>
                </div>
              </div>
            </section>

            <section className={`${styles.card} ${styles.faqCard}`} aria-labelledby="contact-faq-title">
              <h2 id="contact-faq-title">Preguntas frecuentes</h2>
              <p className={styles.cardIntro}>Quizá encuentres la respuesta que buscas aquí.</p>
              <div className={styles.faqList}>
                {questions.map(({ question, answer }) => (
                  <details className={styles.faqItem} key={question}>
                    <summary>{question}<span className={styles.faqChevron}><ContactIcon name="chevron" /></span></summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <section className={`${styles.card} ${styles.messageCard}`} aria-labelledby="contact-message-title">
            <h2 id="contact-message-title">Envíanos un mensaje</h2>
            <p className={styles.cardIntro} id="contact-form-demo-note">Completa el formulario de muestra. No transmite ni conserva tus respuestas.</p>
            <ContactForm />
          </section>
        </div>
      </section>
      <LandingFooter />
    </main>
  );
}
