import { calculateLoan, money } from '../src/core/loan-calculator';

describe('loan calculator', () => {
  it('calculates the disclosed simple annual interest and fee', () => {
    expect(calculateLoan(50_000, 15, 2.5, 12)).toEqual({
      interest: 7_500,
      fee: 1_250,
      total: 58_750,
      monthly: 4_895.83,
    });
  });
  it('rounds monetary values to cents', () => expect(money(10.005)).toBe(10.01));
});
