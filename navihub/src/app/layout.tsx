import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "./components/NavbarWrapper";
import FooterWrapper from "./components/FooterWrapper";
import ChatbotLoader from "./components/ChatbotLoader";
import PinnedSubwayLoader from "./components/PinnedSubwayLoader";
import LayoutClientBoundary from "./components/LayoutClientBoundary";

export const metadata: Metadata = {
  title: "NaviHub",
  description: "Team #2285-1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased min-h-screen flex flex-col`}>
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <PinnedSubwayLoader />
        <LayoutClientBoundary />
        <NavbarWrapper />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <ChatbotLoader />
        <FooterWrapper />
      </body>
    </html>
  );
}