// Stellar operates with a precision of 7 decimal places for assets like XLM & USDC.
export const to7decimals = (amount: string): bigint => BigInt(amount) * BigInt(10_000_000);

export const getIntegerPart = (decimal: string): string => Number.parseInt(decimal).toString();
