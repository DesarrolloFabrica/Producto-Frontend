export const formatDate = (value: string) => {
  if (!value) return 'Sin definir';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Sin definir';
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

export const formatPercent = (value: number) => `${Math.round(value)}%`;

export const initials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
