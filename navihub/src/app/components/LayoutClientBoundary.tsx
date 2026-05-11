"use client";

import dynamic from "next/dynamic";

const ScrollProgressBar = dynamic(
  () => import("./ScrollProgressBar"),
  { ssr: false, loading: () => null }
);

const NewsletterSubscriptionModal = dynamic(
  () => import("./newsletter/NewsletterSubscriptionModal"),
  { ssr: false, loading: () => null }
);

export default function LayoutClientBoundary() {
  return (
    <>
      <ScrollProgressBar />
      <NewsletterSubscriptionModal />
    </>
  );
}
