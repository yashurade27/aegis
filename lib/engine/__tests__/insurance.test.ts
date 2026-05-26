// ============================================================================
// Tests — Insurance Fund
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  createInsuranceFund,
  routeFeeToInsurance,
  claimInsurance,
  canAdminWithdraw,
  adminWithdraw,
} from '../insurance';
import { type Fill, Side } from '../types';

function makeFill(overrides: Partial<Fill> = {}): Fill {
  return {
    maker: 'maker-1',
    taker: 'taker-1',
    price: 100,
    size: 10,
    fee: 10, // $10 fee
    side: Side.Long,
    ...overrides,
  };
}

describe('createInsuranceFund', () => {
  it('creates an empty fund', () => {
    const fund = createInsuranceFund();
    expect(fund.balance).toBe(0);
    expect(fund.totalCollected).toBe(0);
    expect(fund.totalClaimed).toBe(0);
  });
});

describe('routeFeeToInsurance', () => {
  it('routes 80% of fee to insurance fund (8000 bps)', () => {
    const fund = createInsuranceFund();
    const fill = makeFill({ fee: 10 });

    const routed = routeFeeToInsurance(fill, 8000, fund);

    expect(routed).toBe(8); // 10 * 8000 / 10000
    expect(fund.balance).toBe(8);
    expect(fund.totalCollected).toBe(8);
  });

  it('routes 100% of fee when cut is 10000 bps', () => {
    const fund = createInsuranceFund();
    const fill = makeFill({ fee: 10 });

    const routed = routeFeeToInsurance(fill, 10000, fund);

    expect(routed).toBe(10);
    expect(fund.balance).toBe(10);
  });

  it('accumulates across multiple fills', () => {
    const fund = createInsuranceFund();

    routeFeeToInsurance(makeFill({ fee: 10 }), 8000, fund);
    routeFeeToInsurance(makeFill({ fee: 20 }), 8000, fund);

    expect(fund.balance).toBe(24); // 8 + 16
    expect(fund.totalCollected).toBe(24);
  });
});

describe('claimInsurance', () => {
  it('claims from fund successfully', () => {
    const fund = createInsuranceFund();
    fund.balance = 1000;

    const claimed = claimInsurance(fund, 200);

    expect(claimed).toBe(200);
    expect(fund.balance).toBe(800);
    expect(fund.totalClaimed).toBe(200);
  });

  it('claims partial amount when fund is insufficient', () => {
    const fund = createInsuranceFund();
    fund.balance = 50;

    const claimed = claimInsurance(fund, 200);

    expect(claimed).toBe(50);
    expect(fund.balance).toBe(0);
    expect(fund.totalClaimed).toBe(50);
  });

  it('throws for zero or negative claim amount', () => {
    const fund = createInsuranceFund();
    fund.balance = 1000;

    expect(() => claimInsurance(fund, 0)).toThrow('Claim amount must be positive');
    expect(() => claimInsurance(fund, -10)).toThrow('Claim amount must be positive');
  });
});

describe('canAdminWithdraw', () => {
  it('allows withdrawal when balance stays above buffer', () => {
    const fund = createInsuranceFund();
    fund.balance = 20000;

    expect(canAdminWithdraw(fund, 5000, 10000)).toBe(true);
  });

  it('rejects withdrawal that would drop below buffer', () => {
    const fund = createInsuranceFund();
    fund.balance = 12000;

    expect(canAdminWithdraw(fund, 5000, 10000)).toBe(false);
  });

  it('rejects zero or negative amount', () => {
    const fund = createInsuranceFund();
    fund.balance = 20000;

    expect(canAdminWithdraw(fund, 0, 10000)).toBe(false);
    expect(canAdminWithdraw(fund, -100, 10000)).toBe(false);
  });

  it('allows withdrawal of exact overage', () => {
    const fund = createInsuranceFund();
    fund.balance = 15000;

    // 15000 - 5000 = 10000 >= 10000 buffer
    expect(canAdminWithdraw(fund, 5000, 10000)).toBe(true);
  });
});

describe('adminWithdraw', () => {
  it('withdraws successfully when allowed', () => {
    const fund = createInsuranceFund();
    fund.balance = 20000;

    const success = adminWithdraw(fund, 5000, 10000);

    expect(success).toBe(true);
    expect(fund.balance).toBe(15000);
  });

  it('fails when withdrawal would breach buffer', () => {
    const fund = createInsuranceFund();
    fund.balance = 12000;

    const success = adminWithdraw(fund, 5000, 10000);

    expect(success).toBe(false);
    expect(fund.balance).toBe(12000); // Unchanged
  });
});
