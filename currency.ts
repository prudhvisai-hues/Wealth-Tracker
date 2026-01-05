const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export const formatCurrencyINR = (amount: number): string => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return formatter.format(safeAmount);
};
