"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { ContactIcon, type ContactIconName } from "../../components/ContactIcon";
import styles from "./terminos.module.css";

export type TermsSection = {
  id: string;
  title: string;
  icon: ContactIconName;
  content: ReactNode;
};

export function TermsExplorer({ sections }: { sections: TermsSection[] }) {
  const [selectedId, setSelectedId] = useState(sections[0]?.id ?? "");
  const selectedIndex = Math.max(0, sections.findIndex(({ id }) => id === selectedId));
  const selectedSection = sections[selectedIndex];

  const selectAndFocus = (index: number, tabList: HTMLElement) => {
    const nextIndex = (index + sections.length) % sections.length;
    const nextSection = sections[nextIndex];
    setSelectedId(nextSection.id);
    tabList.querySelector<HTMLButtonElement>(`#terms-tab-${nextSection.id}`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const tabList = event.currentTarget.parentElement;
    if (!tabList) return;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      selectAndFocus(index + 1, tabList);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectAndFocus(index - 1, tabList);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectAndFocus(0, tabList);
    } else if (event.key === "End") {
      event.preventDefault();
      selectAndFocus(sections.length - 1, tabList);
    }
  };

  if (!selectedSection) return null;

  return (
    <section className={styles.termsBody} aria-label="Términos de uso">
      <nav className={styles.index} aria-label="Secciones de términos de uso">
        <div className={styles.indexTabs} role="tablist" aria-orientation="vertical" aria-label="Secciones">
          {sections.map(({ id, title, icon }, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                className={selected ? styles.indexLinkActive : styles.indexLink}
                id={`terms-tab-${id}`}
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="terms-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setSelectedId(id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <ContactIcon name={icon} />
                <span>{title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <section className={styles.document} id="terms-panel" role="tabpanel" tabIndex={0} aria-labelledby={`terms-tab-${selectedSection.id}`}>
        <header className={styles.documentHeader}>
          <p className={styles.documentKicker}>Términos de uso</p>
          <p className={styles.updated}>Última actualización: octubre de 2026</p>
        </header>
        <article className={styles.articleContent}>
          <h2>{selectedIndex + 1}. {selectedSection.title}</h2>
          {selectedSection.content}
        </article>
      </section>
    </section>
  );
}
