import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot"
import ScrollProgressBar from "./components/ScrollProgressBar";

export const metadata: Metadata = {
  title: "NaviHub",
  description: "Team #2014-1",
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
        <ScrollProgressBar />
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Chatbot />
        <Footer />
      </body>
    </html>
  );
}