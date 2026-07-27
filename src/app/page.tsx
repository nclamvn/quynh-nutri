import type { Metadata } from "next";
import { LandingHeader } from "@/ui/marketing/LandingHeader";
import { Hero } from "@/ui/marketing/Hero";
import { Ticker } from "@/ui/marketing/Ticker";
import { Manifesto } from "@/ui/marketing/Manifesto";
import { ProductStage } from "@/ui/marketing/ProductStage";
import { MemoryRows } from "@/ui/marketing/MemoryRows";
import { DataTruth } from "@/ui/marketing/DataTruth";
import { BrandQuote } from "@/ui/marketing/BrandQuote";
import { FinalCTA } from "@/ui/marketing/FinalCTA";
import { LandingFooter } from "@/ui/marketing/LandingFooter";

// Public marketing landing (blueprint §5, order LOCKED). Server component — the
// sections are static + CSS motion; no app shell, no store needed.
export const metadata: Metadata = {
  title: "Bữa cơm nhà — Một tuần ăn ngon, vừa sức và có căn cứ",
  description:
    "Hệ thống lập bữa cho gia đình Việt: xoay món, cân lượng, gộp chợ và nói thật độ chắc của từng con số.",
};

export default function LandingPage() {
  return (
    <main className="bg-landing-ink">
      <LandingHeader />
      <Hero />
      <Ticker />
      <Manifesto />
      <ProductStage />
      <MemoryRows />
      <DataTruth />
      <BrandQuote />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
