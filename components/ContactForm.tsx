"use client";

import { useRef, useState } from "react";
import { ContactIcon } from "./ContactIcon";
import styles from "../app/contacto/contacto.module.css";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState("");

  function handleDemoSend() {
    if (!formRef.current?.reportValidity()) return;
    setStatus("Demo de portafolio: el mensaje no se envió ni se guardó.");
  }

  return (
    <form className={styles.form} ref={formRef} onSubmit={(event) => event.preventDefault()}>
      <div className={styles.field}>
        <label htmlFor="contact-name">Nombre</label>
        <div className={styles.inputWrap}>
          <ContactIcon name="user" />
          <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={100} placeholder="Tu nombre" required />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-email">Correo electrónico</label>
        <div className={styles.inputWrap}>
          <ContactIcon name="mail" />
          <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="tu@correo.com" required />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-subject">Asunto</label>
        <div className={`${styles.inputWrap} ${styles.selectWrap}`}>
          <ContactIcon name="list" />
          <select id="contact-subject" name="subject" defaultValue="" required>
            <option value="" disabled>Selecciona un motivo</option>
            <option value="consulta">Consulta general</option>
            <option value="soporte">Soporte técnico</option>
            <option value="sugerencia">Sugerencia</option>
            <option value="privacidad">Privacidad</option>
            <option value="otro">Otro</option>
          </select>
          <span className={styles.selectChevron}><ContactIcon name="chevron" /></span>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message">Mensaje</label>
        <div className={`${styles.inputWrap} ${styles.textareaWrap}`}>
          <ContactIcon name="message" />
          <textarea id="contact-message" name="message" maxLength={2000} placeholder="Cuéntanos en qué podemos ayudarte..." required />
        </div>
      </div>

      <div className={styles.formFooter}>
        <button className="landing-cta" type="button" onClick={handleDemoSend} aria-describedby="contact-form-demo-note">
          Enviar mensaje <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className={styles.formStatus} role="status" aria-live="polite">{status}</p>
    </form>
  );
}
