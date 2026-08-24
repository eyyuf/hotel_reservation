export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
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
