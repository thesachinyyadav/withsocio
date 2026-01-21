import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: "WSOCIO - Creative Agency | Video Production, Personal Branding & Web Development",
  description: "Premium video production, personal branding, and web development services that transform your vision into impactful digital experiences. Based in Bangalore, India.",
  keywords: ["video production", "personal branding", "web development", "creative agency", "bangalore", "digital marketing", "social media"],
  authors: [{ name: "With Socio" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WSOCIO",
  },
  icons: {
    icon: [
      { url: "/withsocio.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/withsocio.svg" },
    ],
  },
  openGraph: {
    title: "WSOCIO - Creative Agency",
    description: "Premium video production, personal branding, and web development services",
    url: "https://withsocio.com",
    siteName: "WSOCIO",
    type: "website",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#154CB3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/withsocio.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/withsocio.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WSOCIO" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#154CB3" />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
