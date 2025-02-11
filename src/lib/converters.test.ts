import { expect, test } from 'vitest';
import { decimalStringToStroops, stroopsToDecimalString } from './converters';

test('Parses 0 to stroops', () => {
  expect(decimalStringToStroops('0')).toEqual(0n);
});

test('Parses "100" to stroops', () => {
  expect(decimalStringToStroops('100')).toEqual(1_000_000_000n);
});

test('Parses "0.045" to stroops', () => {
  expect(decimalStringToStroops('0.045')).toEqual(450_000n);
});

test('Formats 0 as decimal string', () => {
  expect(stroopsToDecimalString(0n)).toEqual('0');
});

test('Formats 100_000_000 as decimal string', () => {
  expect(stroopsToDecimalString(100_000_000n)).toEqual('10');
});

test('Formats 400 as decimal string', () => {
  expect(stroopsToDecimalString(400n)).toEqual('0.00004');
});
