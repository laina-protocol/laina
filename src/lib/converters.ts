// Stellar operates with a precision of 7 decimal places for assets like XLM & USDC.
export const to7decimals = (amount: string): bigint => BigInt(amount) * BigInt(10_000_000);

export const getIntegerPart = (decimal: string): string => Number.parseInt(decimal).toString();

export const isBalanceZero = (decimal: string): boolean => Number.parseInt(decimal.replace('.', '')) === 0;

export const getStroops = (decimal: string): bigint => BigInt(decimal.replace('.', ''));

const DECIMALS = 7;

/** Convert a stroops value to a string with 7 decimals. */
export const stroopsToDecimalString = (stroops: bigint): string => {
  // Assumes the value is positive.
  let stroopsStr = stroops.toString();

  // If shorter than 7 decimals, pad with leading zeros
  if (stroopsStr.length <= DECIMALS) {
    stroopsStr = stroopsStr.padStart(8, '0');
  }

  // Separate integer and fractional parts.
  const intPart = stroopsStr.slice(0, stroopsStr.length - DECIMALS);
  const fracPart = stroopsStr.slice(stroopsStr.length - DECIMALS).replace(/0+$/, ''); // Remove trailing zeros from the fraction

  return fracPart === '' ? intPart : `${intPart}.${fracPart}`;
};

/** Convert a decimal string with 7 decimals to a bigint */
export const decimalStringToStroops = (value: string): bigint => {
  // Split into integer and fractional parts
  let [intPart, fracPart = ''] = value.split('.');
  if (!intPart) {
    // If the string was like ".45", intPart is ""
    intPart = '0';
  }

  // If fraction is shorter than 7, pad with zeros
  if (fracPart.length < DECIMALS) {
    fracPart = fracPart.padEnd(DECIMALS, '0');
  }

  // Combine integer + fractional part. e.g. "123" + "4567890" => "1234567890"
  const combinedStr = intPart + fracPart;

  // Convert to BigInt
  return BigInt(combinedStr);
};
