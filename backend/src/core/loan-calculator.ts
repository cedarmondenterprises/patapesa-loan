export const money = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateLoan(amount: number, annualRate: number, feeRate: number, months: number) {
  const interest = money(amount * (annualRate / 100) * (months / 12));
  const fee = money(amount * (feeRate / 100));
  const total = money(amount + interest + fee);
  return { interest, fee, total, monthly: money(total / months) };
}
