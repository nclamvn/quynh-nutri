import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/ui/providers";
import { isE2EMode } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// Lora = the ONLY serif – display marketing + quotes only (blueprint §19). Italic
// axis carries the landing hook/quote voice; Georgia is the fallback with dấu.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anngon.io"),
  title: {
    default: "Ăn Ngon · Bữa cơm nhà",
    template: "%s · Ăn Ngon",
  },
  description: "Kế hoạch bữa cơm gia đình Việt – định lượng có nguồn, đi chợ gọn.",
  manifest: "/manifest.webmanifest",
  applicationName: "Ăn Ngon",
  authors: [{ name: "Q's Kitchen" }],
  creator: "Q's Kitchen",
  publisher: "Q's Kitchen",
  appleWebApp: { capable: true, title: "Bữa cơm nhà", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#141216" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Set theme class before paint to avoid a flash of the wrong theme.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const e2e = isE2EMode();
  return (
    <html lang="vi" className={`${inter.variable} ${lora.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <Providers e2e={e2e}>{children}</Providers>
      </body>
    </html>
  );
}
