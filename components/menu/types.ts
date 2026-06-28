// Contract every menu template implements. The public page (RSC) builds these — image URLs are
// signed server-side (imgproxy secret stays off the client), so templates receive render-ready
// `src`/`srcSet`/`blurDataURL`, not raw object keys.

export type Localized = { fa: string; en?: string };

export interface MenuImage {
  src: string; // signed imgproxy URL at a sensible default width
  srcSet: string; // signed responsive srcset
  blurDataURL: string; // LQIP from blurhash
  width: number;
  height: number;
}

export interface MenuItem {
  id: string;
  name: Localized;
  description?: Localized;
  ingredients: string[];
  calories?: number;
  price?: number; // whole تومان; omitted when the café hides price
  isAvailable: boolean;
  images: MenuImage[];
}

export interface MenuCategory {
  id: string;
  name: Localized;
  items: MenuItem[];
}

export interface MenuTemplateProps {
  cafe: {
    name: string;
    defaultLocale: string;
    logoSrc?: string | null; // signed imgproxy URL for the café logo; null = no logo
  };
  categories: MenuCategory[];
}
