"use client";

export default function NewsCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`news-card news-card--skeleton ${featured ? "news-card--featured" : ""}`}>
      <div className="news-card__image-wrap skeleton-shimmer" />
      <div className="news-card__body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line skeleton-line--text" />
        <div className="skeleton-line skeleton-line--text skeleton-line--short" />
        <div className="news-card__meta">
          <div className="skeleton-line skeleton-line--chip" />
          <div className="skeleton-line skeleton-line--chip" />
        </div>
      </div>
    </div>
  );
}
