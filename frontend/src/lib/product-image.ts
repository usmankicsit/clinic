import type { Product } from './types';

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

export const FALLBACK_PRODUCT_IMAGE = `${API_ORIGIN}/uploads/products/product-01.jpg`;

const NAME_DEFAULTS: Record<string, string> = {
  'Pure Honey': '/uploads/products/product-01.jpg',
  'Premium Dry Fruits Honey Mix': '/uploads/products/product-03.jpg',
  'Majoon-e-Aujaiya': '/uploads/products/product-07.jpg',
  'Joint Support Herbal Remedy': '/uploads/products/product-08.jpg',
  'Back & Disc Support': '/uploads/products/product-09.jpg',
  'Majoon-e-Nissa': '/uploads/products/product-11.jpg',
  'Male Fertility Support': '/uploads/products/product-12.jpg',
  'Female Fertility Support': '/uploads/products/product-13.jpg',
  'Safoof-e-Tabkhir': '/uploads/products/product-10.jpg',
  'Daily Wellness Herbal Mix': '/uploads/products/product-14.jpg',
  'Energy Support Formula': '/uploads/products/product-16.jpg',
  'General Health Support': '/uploads/products/product-17.jpg',
  'Zafran (Saffron) Premium': '/uploads/products/product-18.jpg',
  'Sand Fish Extract': '/uploads/products/product-19.jpg',
  'Premium Herbs Assortment': '/uploads/products/product-20.jpg',
};

/** Display image: custom upload/URL, else name-based dummy, else fallback. */
export function productImageSrc(product: Pick<Product, 'name' | 'imageUrl'>) {
  if (product.imageUrl) {
    if (product.imageUrl.startsWith('http')) return product.imageUrl;
    return `${API_ORIGIN}${product.imageUrl}`;
  }
  const named = NAME_DEFAULTS[product.name];
  if (named) {
    return named.startsWith('http') ? named : `${API_ORIGIN}${named}`;
  }
  return FALLBACK_PRODUCT_IMAGE;
}

export function hasCustomImage(product: Pick<Product, 'imageUrl'>) {
  return Boolean(product.imageUrl);
}
