import { isRecentKenyanPaymentDate, kenyaDate } from '../src/core/kenya-date';

describe('Kenyan repayment receipt dates', () => {
  const earlyMorning = new Date('2026-10-09T00:05:00.000Z'); // 03:05 in Nairobi

  it('accepts the current Kenyan day even before noon', () => {
    expect(kenyaDate(earlyMorning)).toBe('2026-10-09');
    expect(isRecentKenyanPaymentDate('2026-10-09', earlyMorning)).toBe(true);
    expect(isRecentKenyanPaymentDate('2026-10-10', earlyMorning)).toBe(false);
  });

  it('uses Kenya time across the UTC date boundary', () => {
    const lateEvening = new Date('2026-10-08T21:05:00.000Z'); // 00:05 in Nairobi
    expect(kenyaDate(lateEvening)).toBe('2026-10-09');
    expect(isRecentKenyanPaymentDate('2026-10-09', lateEvening)).toBe(true);
  });

  it('allows 31 calendar days and rejects older or invalid dates', () => {
    expect(isRecentKenyanPaymentDate('2026-09-08', earlyMorning)).toBe(true);
    expect(isRecentKenyanPaymentDate('2026-09-07', earlyMorning)).toBe(false);
    expect(isRecentKenyanPaymentDate('2026-02-30', earlyMorning)).toBe(false);
  });
});
