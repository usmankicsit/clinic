const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

export function mediaUrl(path?: string | null, fallback = '') {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  // Static assets hosted with the Next.js frontend (Vercel)
  if (path.startsWith('/products/') || path.startsWith('/banners/')) {
    return path;
  }
  if (path.startsWith('/uploads/products/')) {
    return path.replace('/uploads/products/', '/products/');
  }
  return `${API_ORIGIN}${path}`;
}

export function whatsappLink(whatsapp?: string | null) {
  const digits = (whatsapp || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '#';
}

export function telLink(phone?: string | null) {
  const digits = (phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '#';
}
