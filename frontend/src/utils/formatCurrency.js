export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  const num = Number(amount);
  return `ETB ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
