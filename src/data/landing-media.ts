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
    src: "/landing/hero-family.jpg",
    author: "Rhoda Baer",
    sourceUrl: "https://unsplash.com/photos/2hOoIAEQfFs",
    alt: "Một gia đình gồm bố, mẹ và con nhỏ quây quần bên bàn ăn, cùng chia sẻ bữa cơm",
    cropFocus: "center",
    width: 2400,
    height: 1920,
  },
  stage: {
    id: "stage",
    src: "/landing/mam-com.jpg",
    author: "Khuc Le Thanh Danh",
    sourceUrl: "https://unsplash.com/photos/nOG5RGMmEKk",
    alt: "Mâm cơm Việt Nam nhìn từ trên xuống với nhiều bát đĩa món ăn khác nhau",
    cropFocus: "center",
    width: 1800,
    height: 2700,
  },
  market: {
    id: "market",
    src: "/landing/market.jpg",
    author: "Kevin Charit",
    sourceUrl: "https://unsplash.com/photos/HXeHsf9SPUQ",
    alt: "Người dân dùng bữa tại một khu chợ ẩm thực nhộn nhịp ở Sài Gòn",
    cropFocus: "center",
    width: 1800,
    height: 2700,
  },
  bunbo: {
    id: "bunbo",
    src: "/landing/bunbo.jpg",
    author: "Vy Huynh",
    sourceUrl: "https://unsplash.com/photos/rcHHKG01IPY",
    alt: "Tô bún bò Huế với nước dùng và rau thơm xanh",
    cropFocus: "center",
    width: 1200,
    height: 800,
  },
};

/** Ordered list for the footer's media credits. */
export const LANDING_CREDITS = Object.values(LANDING_MEDIA);
