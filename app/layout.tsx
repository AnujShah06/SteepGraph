import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import WelcomeBubble from "@/components/WelcomeBubble";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "SteepWisdom — Tea Discovery",
  description:
    "A tea discovery tool. 150 real teas from 11 brands, visualized as an interactive knowledge graph.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Mono:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <WelcomeBubble />
        <Analytics />
      </body>
    </html>
  );
}
