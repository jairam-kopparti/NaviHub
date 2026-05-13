import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "./components/NavbarWrapper";
import FooterWrapper from "./components/FooterWrapper";
import Chatbot from "./components/Chatbot"
import FloatingTools from "./components/FloatingTools";
import ScrollProgressBar from "./components/ScrollProgressBar";
import NewsletterSubscriptionModal from "./components/newsletter/NewsletterSubscriptionModal";

export const metadata: Metadata = {
  title: "NaviHub",
  description: "Team #2295-1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased min-h-screen flex flex-col`}>
        {/*<a href="#main-content" className="skip-to-content">Skip to main content</a>*/}
        <NewsletterSubscriptionModal />
        <ScrollProgressBar />
        <NavbarWrapper />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <FloatingTools />
        <Chatbot />
        <FooterWrapper />
      </body>
    </html>
  );
}