export const formatDate = (dateString) => {
  if (!dateString) return '';
  const normalized = typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())
    ? `${dateString.trim()}T00:00:00`
    : dateString;
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateRange = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '';
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = start.getFullYear() === end.getFullYear()
    ? end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
};

export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end - start;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

export const getLocalDateString = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeDate = (dateInput) => {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    return getLocalDateString(dateInput);
  }
  const str = String(dateInput).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return getLocalDateString(d);
  }
  return '';
};

export const isSameDay = (date1, date2) => {
  const norm1 = normalizeDate(date1);
  const norm2 = normalizeDate(date2);
  return Boolean(norm1 && norm2 && norm1 === norm2);
};

