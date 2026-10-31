import type { Metadata } from "next";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { NotFoundContent } from "@/features/not-found/components/NotFoundContent";

export const metadata: Metadata = {
  title: "Página no encontrada | GlorIA Futbolera",
  description: "La página que buscas no está disponible.",
};

export default function NotFound() {
  return (
    <div className="landing-page landing-not-found-page">
      <LandingHeader currentPage="other" />
      <NotFoundContent
        homeHref="/"
        homeLabel="Volver al inicio"
        matchesHref="/competitions"
        matchesLabel="Explorar competiciones"
        variant="public"
      />
      <LandingFooter />
    </div>
  );
}
