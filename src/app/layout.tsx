import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Providers } from "@/ui/providers";
import { isE2EMode } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// Lora = the ONLY serif — display marketing + quotes only (blueprint §19). Italic
// axis carries the landing hook/quote voice; Georgia is the fallback with dấu.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bữa cơm nhà",
  description: "Kế hoạch bữa cơm gia đình Việt — định lượng có nguồn, đi chợ gọn.",
  manifest: "/manifest.webmanifest",
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
  const content = <Providers e2e={e2e}>{children}</Providers>;
  return (
    <html lang="vi" className={`${inter.variable} ${lora.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        {e2e ? content : (
          <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
            {content}
          </ClerkProvider>
        )}
      </body>
    </html>
  );
}
