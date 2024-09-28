// 7 decimal numbers is the smallest unit of XLM, stroop.
const SCALAR_7 = 10_000_000n;

const TEN_K = 10_000n * SCALAR_7;
const ONE_M = 1_000_000n * SCALAR_7;

export const formatAmount = (amount: bigint): string => {
  if (amount === 0n) return '0';

  if (amount > ONE_M) {
    return `${(Number(amount) / (1_000_000 * 10_000_000)).toFixed(2)}M`;
  }
  if (amount > TEN_K) {
    return `${(Number(amount) / (1_000 * 10_000_000)).toFixed(1)}K`;
  }
  return `${(Number(amount) / 10_000_000).toFixed(1)}`;
};

export const toDollarsFormatted = (price: bigint, amount: bigint) => {
  if (amount === 0n) return '$0';
  return formatDollarAmount(toDollars(price, amount));
};

export const toDollars = (price: bigint, amount: bigint) => ((price / SCALAR_7) * amount) / SCALAR_7;

export const formatDollarAmount = (amount: bigint) => {
  if (amount === 0n) return '$0';
  if (amount > ONE_M) {
    return `$${(Number(amount) / (1_000_000 * 10_000_000)).toFixed(2)}M`;
  }
  if (amount > TEN_K) {
    return `$${(Number(amount) / (1_000 * 10_000_000)).toFixed(1)}K`;
  }
  return `$${(Number(amount) / 10_000_000).toFixed(1)}`;
};
