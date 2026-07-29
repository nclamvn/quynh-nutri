"use client";

import type { Commodity } from "@/domain/types";
import type { LocalizedText } from "@/domain/kitchen-execution";
import { localize } from "@/domain/kitchen-execution";
import { kitchenGuideFor } from "@/data/seed/kitchen-guides";
import { useI18n } from "@/i18n/context";
import { BottomSheet } from "@/ui/components/BottomSheet";

type GuideSectionProps = {
  icon: string;
  title: string;
  items: LocalizedText[];
  lang: "vi" | "en";
  tone?: "default" | "warning";
};

function GuideSection({ icon, title, items, lang, tone = "default" }: GuideSectionProps) {
  if (items.length === 0) return null;
  return (
    <section className={`rounded-[16px] border p-3 ${
      tone === "warning" ? "border-amber/35 bg-amber-weak/50" : "border-hairline bg-surface/45"
    }`}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm leading-relaxed text-muted">
            <span aria-hidden className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-current" />
            <span>{localize(item, lang)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IngredientGuideSheet({
  commodity,
  onClose,
}: {
  commodity: Commodity | undefined;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const resolved = kitchenGuideFor(commodity);
  const name = commodity
    ? lang === "en" && commodity.labelEn
      ? commodity.labelEn
      : commodity.canonicalVn
    : "";

  return (
    <BottomSheet open={!!commodity} onClose={onClose} title={name}>
      {commodity && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("detail.close")}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface/75 text-lg leading-none text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            ×
          </button>
          {resolved ? (
            <>
              <div className="flex items-center justify-between gap-3 rounded-[14px] bg-brand-weak/55 px-3 py-2">
                <p className="text-xs font-medium text-brand-ink">
                  {resolved.guide.specificity === "ingredient"
                    ? t("kitchen.guideSpecific")
                    : t("kitchen.guideCategory")}
                </p>
                <span className="shrink-0 text-[10px] text-muted">{t("kitchen.checkedContent")}</span>
              </div>

              <GuideSection icon="✓" title={t("kitchen.choose")} items={resolved.guide.selection} lang={lang} />
              <GuideSection icon="!" title={t("kitchen.avoid")} items={resolved.guide.avoid} lang={lang} tone="warning" />
              <GuideSection icon="↗" title={t("kitchen.transport")} items={resolved.guide.transport} lang={lang} />
              <GuideSection icon="❄" title={t("kitchen.storage")} items={resolved.guide.storage} lang={lang} />
              <GuideSection icon="♨" title={t("kitchen.preparation")} items={resolved.guide.preparation} lang={lang} />

              <section className="border-t border-hairline pt-3">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                  {t("kitchen.sources")}
                </h3>
                <ul className="space-y-2">
                  {resolved.sources.map((source) => (
                    <li key={source.id} className="text-xs leading-relaxed">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand underline decoration-brand/30 underline-offset-2"
                      >
                        {localize(source.title, lang)}
                      </a>
                      <p className="text-muted">
                        {source.publisher} · {t("kitchen.reviewed")} {source.reviewedAt}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <div className="rounded-[16px] border border-hairline bg-surface/45 p-4 text-sm text-muted">
              <p className="font-medium text-ink">{t("kitchen.noGuideTitle")}</p>
              <p className="mt-1 leading-relaxed">{t("kitchen.noGuideBody")}</p>
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-muted">{t("kitchen.safetyNote")}</p>
        </div>
      )}
    </BottomSheet>
  );
}
