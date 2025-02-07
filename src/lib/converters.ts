// Stellar operates with a precision of 7 decimal places for assets like XLM & USDC.
export const to7decimals = (amount: string): bigint => BigInt(amount) * BigInt(10_000_000);

export const getIntegerPart = (decimal: string): string => Number.parseInt(decimal).toString();

export const isBalanceZero = (decimal: string): boolean => Number.parseInt(decimal.replace('.', '')) === 0;

export const getStroops = (decimal: string): bigint => BigInt(decimal.replace('.', ''));

const DECIMALS = 7;

/** Convert a stroops value to a string with 7 decimals. */
export const stroopsToDecimalString = (stroops: bigint): string => {
  // Assumes the value is positive.
  const stroopsStr = stroops.toString();

  // If shorter than 7 decimals, pad with leading zeros
  if (stroopsStr.length <= DECIMALS) {
    stroopsStr.padStart(8, '0');
  }

  const intPart = stroopsStr.slice(0, stroopsStr.length - DECIMALS);
  const fracPart = stroopsStr.slice(stroopsStr.length - DECIMALS);

  return intPart + '.' + fracPart;
};

/** Convert a string with 7 decimals to a bigint */
export const decimalStringToStroops = (decimal: string): bigint => {
  const asFloat = Number.parseFloat(decimal);

  const scaled = asFloat * 10_000_000

  return BigInt(Math.trunc(scaled));
};
