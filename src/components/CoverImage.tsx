"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { CoverImage as Cover } from "@/lib/domain/coverImage";

/**
 * Cover image of an experience or challenge, filling its positioned parent. If the link stops working it renders
 * `fallback` instead (the line icon on cards, nothing on detail pages), so a broken box never shows.
 */
export function CoverImage({
  cover,
  className,
  sizes,
  fallback = null,
  frameClassName,
  priority = false,
}: {
  cover: Cover;
  className?: string;
  sizes: string;
  fallback?: ReactNode;
  frameClassName?: string;
  priority?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (failedUrl === cover.url) return <>{fallback}</>;
  const image = (
    <Image
      src={cover.url}
      alt={cover.alt}
      fill
      sizes={sizes}
      className={className}
      preload={priority}
      onError={() => setFailedUrl(cover.url)}
    />
  );
  return frameClassName ? <figure className={frameClassName}>{image}</figure> : image;
}
