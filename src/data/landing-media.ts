// Landing media manifest — provenance for every marketing image (blueprint §25).
// Real, licensed Unsplash photos, DOWNLOADED into /public/landing (never hotlinked).
// The owner may swap the art later; keep author + sourceUrl + alt accurate and
// never fabricate a credit. Unsplash License: free for commercial use, attribution
// appreciated (we credit anyway, in the footer's media-credits).
export interface LandingAsset {
  id: string;
  src: string; // local path under /public
  author: string;
  sourceUrl: string; // canonical Unsplash photo page
  alt: string;
  cropFocus: string; // guidance for object-position when cropping
  width: number;
  height: number;
}

export const LANDING_MEDIA: Record<string, LandingAsset> = {
  hero: {
    id: "hero",
    src: "/landing/hero.webp",
    author: "National Cancer Institute",
    sourceUrl: "https://unsplash.com/photos/family-eating-at-the-table-BQPi8F_UON0",
    alt: "Một gia đình quây quần bên bàn ăn, cùng chia sẻ bữa cơm",
    cropFocus: "48% 50%",
    width: 2400,
    height: 1920,
  },
  stage: {
    id: "stage",
    src: "/landing/stage-food.webp",
    author: "Nguyen Mazic",
    sourceUrl: "https://unsplash.com/photos/a-spread-of-vietnamese-food-with-stuffed-bitter-melon-tlhWfPVzIQY",
    alt: "Mâm cơm Việt Nam với canh khổ qua nhồi thịt và các món ăn kèm",
    cropFocus: "50% 46%",
    width: 1800,
    height: 1200,
  },
};

/** Ordered list for the footer's media credits. */
export const LANDING_CREDITS = Object.values(LANDING_MEDIA);
