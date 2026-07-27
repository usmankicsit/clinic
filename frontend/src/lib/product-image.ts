import type { Product } from './types';

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

export const FALLBACK_PRODUCT_IMAGE = '/products/product-01.jpg';

const NAME_DEFAULTS: Record<string, string> = {
  'Pure Honey': '/products/product-01.jpg',
  'Premium Dry Fruits Honey Mix': '/products/product-03.jpg',
  'Majoon-e-Aujaiya': '/products/product-07.jpg',
  'Joint Support Herbal Remedy': '/products/product-08.jpg',
  'Back & Disc Support': '/products/product-09.jpg',
  'Majoon-e-Nissa': '/products/product-11.jpg',
  'Male Fertility Support': '/products/product-12.jpg',
  'Female Fertility Support': '/products/product-13.jpg',
  'Safoof-e-Tabkhir': '/products/product-10.jpg',
  'Daily Wellness Herbal Mix': '/products/product-14.jpg',
  'Energy Support Formula': '/products/product-16.jpg',
  'General Health Support': '/products/product-17.jpg',
  'Zafran (Saffron) Premium': '/products/product-18.jpg',
  'Sand Fish Extract': '/products/product-19.jpg',
  'Premium Herbs Assortment': '/products/product-20.jpg',
};

function resolvePath(path: string) {
  if (path.startsWith('http')) return path;
  // Catalog images ship with the Next.js app (Vercel-friendly)
  if (path.startsWith('/products/')) return path;
  if (path.startsWith('/uploads/products/')) {
    return path.replace('/uploads/products/', '/products/');
  }
  // Custom uploads still live on the API host
  return `${API_ORIGIN}${path}`;
}

/** Display image: custom upload/URL, else name-based catalog image, else fallback. */
export function productImageSrc(product: Pick<Product, 'name' | 'imageUrl'>) {
  if (product.imageUrl) return resolvePath(product.imageUrl);
  const named = NAME_DEFAULTS[product.name];
  if (named) return resolvePath(named);
  return FALLBACK_PRODUCT_IMAGE;
}

export function hasCustomImage(product: Pick<Product, 'imageUrl'>) {
  if (!product.imageUrl) return false;
  // Catalog defaults are not "custom uploads"
  if (product.imageUrl.startsWith('/products/')) return false;
  if (product.imageUrl.startsWith('/uploads/products/')) return false;
  return true;
}
