import type { Metadata, Viewport } from "next";

import { Playfair_Display, Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { ProProvider } from "@/context/ProContext";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Binara \u2014 Binaural Beats Engineered for Your Brain",
  description:
    "Create and listen to binaural beats with 24 presets, a modular mixer, and a full synthesis playground. Phone sensor control, WAV export, and more. Free to start.",
  keywords: [
    "binaural beats",
    "brainwave entrainment",
    "focus",
    "sleep",
    "meditation",
    "theta waves",
    "alpha waves",
    "delta waves",
    "sound therapy",
    "frequency healing",
  ],
  authors: [{ name: "Remigijus Dzingelevi\u010Dius" }],
  creator: "Remigijus Dzingelevi\u010Dius",
  metadataBase: new URL("https://binara.app"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Binara",
  },
  openGraph: {
    title: "Binara \u2014 Binaural Beats Engineered for Your Brain",
    description:
      "Create and listen to binaural beats with 24 presets, a modular mixer, and a full synthesis playground.",
    url: "https://binara.app",
    siteName: "Binara",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Binara \u2014 Binaural Beats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Binara \u2014 Binaural Beats Engineered for Your Brain",
    description:
      "Create and listen to binaural beats with 24 presets, a modular mixer, and a full synthesis playground.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050810",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Binara",
              description:
                "Binaural beats engineered for your brain. 24 presets, 3 creation modes, phone sensor control.",
              url: "https://binara.app",
              applicationCategory: "HealthApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free to use with optional Pro upgrade",
              },
              author: {
                "@type": "Person",
                name: "Remigijus Dzingelevi\u010Dius",
              },
            }),
          }}
        />
        {/* Privacy-friendly analytics by Plausible */}
        <script async src="https://plausible.io/js/pa-hDSusz4l1UN40m8gFZsnn.js"></script>
        <script dangerouslySetInnerHTML={{ __html: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()` }} />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} ${cormorant.variable} antialiased`}
      >
        <ProProvider>
          <AppProvider>
            {children}
            <ServiceWorkerRegistration />
          </AppProvider>
        </ProProvider>
      </body>
    </html>
  );
}
