import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DocsChat } from "@/components/docs-chat";
import { UmamiAnalytics } from "@/components/umami-analytics";
import { PAGE_TITLES } from "@/lib/page-titles";
import { cookies } from "next/headers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://json-render.dev"),
  title: {
    default: `json-render | ${PAGE_TITLES[""]}`,
    template: "%s | json-render",
  },
  description:
    "The Generative UI framework. Generate dashboards, widgets, and apps from prompts — safely constrained to components you define.",
  keywords: [
    "json-render",
    "generative UI",
    "AI UI generation",
    "user-generated interfaces",
    "React components",
    "React Native",
    "guardrails",
    "structured output",
    "dashboard builder",
  ],
  authors: [{ name: "Vercel Labs" }],
  creator: "Vercel Labs",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://json-render.dev",
    siteName: "json-render",
    title: "json-render | The Generative UI Framework",
    description:
      "The Generative UI framework. Generate dashboards, widgets, and apps from prompts — safely constrained to components you define.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "json-render - The Generative UI Framework",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "json-render | The Generative UI Framework",
    description:
      "The Generative UI framework. Generate dashboards, widgets, and apps from prompts — safely constrained to components you define.",
    images: ["/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const chatOpen = cookieStore.get("docs-chat-open")?.value === "true";
  const chatWidth = Number(cookieStore.get("docs-chat-width")?.value) || 400;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {chatOpen && (
          <style
            dangerouslySetInnerHTML={{
              __html: `@media(min-width:640px){body{padding-right:${chatWidth}px}}`,
            }}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelSquare.variable}`}
      >
        <ThemeProvider>
          {children}
          <DocsChat defaultOpen={chatOpen} defaultWidth={chatWidth} />
        </ThemeProvider>
        <UmamiAnalytics />
      </body>
    </html>
  );
}
