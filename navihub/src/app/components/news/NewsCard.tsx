"use client";

import { ExternalLink, Calendar, MapPin } from "lucide-react";
import type { NewsArticle } from "../../lib/types";

interface Props {
  article: NewsArticle;
  featured?: boolean;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewsCard({ article, featured = false }: Props) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`news-card ${featured ? "news-card--featured" : ""}`}
    >
      {/* Image */}
      <div className="news-card__image-wrap">
        {article.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={article.image_url}
            alt={article.title}
            className="news-card__image"
            loading={featured ? "eager" : "lazy"}
          />
        ) : (
          <div className="news-card__image-placeholder">
            <span>📰</span>
          </div>
        )}
        {article.category && (
          <span className="news-card__badge">{article.category}</span>
        )}
      </div>

      {/* Body */}
      <div className="news-card__body">
        <h3 className="news-card__title">{article.title}</h3>
        <p className="news-card__desc">{article.description}</p>

        <div className="news-card__meta">
          <span className="news-card__meta-item">
            <Calendar size={14} />
            {timeAgo(article.published_at)}
          </span>
          {article.borough && (
            <span className="news-card__meta-item">
              <MapPin size={14} />
              {article.borough}
            </span>
          )}
          {article.source_name && (
            <span className="news-card__meta-item news-card__source">
              {article.source_name}
            </span>
          )}
        </div>
      </div>

      <div className="news-card__link-icon">
        <ExternalLink size={16} />
      </div>
    </a>
  );
}
