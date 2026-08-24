import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "TELLmeMORE Playground",
  description: "Four fast English adventures for curious players aged 5 and up.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "TELLmeMORE Playground",
    description: "Pick your zone. Four fast English adventures for curious players aged 5 and up.",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "TELLmeMORE Playground — Pick Your Zone" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TELLmeMORE Playground",
    description: "Pick your zone. Four fast English adventures for curious players aged 5 and up.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
