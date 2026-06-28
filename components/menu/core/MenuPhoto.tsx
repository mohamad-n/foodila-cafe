import type { MenuImage } from "../types";

/**
 * Renders a menu photo with a blurhash LQIP behind it (shows while the real image loads).
 * No client state — SSR/no-JS friendly. <img> (not next/image) because the imgproxy URLs are
 * already signed server-side. object-fit is `cover` by default; the fullscreen scope overrides
 * it to `contain` via CSS.
 */
export function MenuPhoto({
  image,
  alt,
  sizes,
}: {
  image: MenuImage;
  alt: string;
  sizes: string;
}) {
  return (
    <div className="photo" style={{ backgroundImage: `url("${image.blurDataURL}")` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={sizes}
        alt={alt}
        width={image.width}
        height={image.height}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
