export const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
};
