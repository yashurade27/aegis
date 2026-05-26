// ============================================================================
// Aegis Vault — Insurance Fund
// Manages protocol insurance: fee routing, claims, and admin withdrawals.
// ============================================================================

import { type Fill, type InsuranceFund, BPS_DENOMINATOR } from './types';

/**
 * Create a new insurance fund with zero balance.
 */
export function createInsuranceFund(): InsuranceFund {
  return {
    balance: 0,
    totalCollected: 0,
    totalClaimed: 0,
  };
}

/**
 * Route a portion of a trade fee into the insurance fund.
 * insuranceAmount = fill.fee * insuranceCutBps / 10000
 *
 * Returns the amount routed to the fund.
 */
export function routeFeeToInsurance(
  fill: Fill,
  insuranceCutBps: number,
  fund: InsuranceFund
): number {
  const insuranceAmount =
    (fill.fee * insuranceCutBps) / BPS_DENOMINATOR;
  fund.balance += insuranceAmount;
  fund.totalCollected += insuranceAmount;
  return insuranceAmount;
}

/**
 * Claim from the insurance fund to cover bad debt (e.g., after liquidation
 * where the collateral didn't cover the loss).
 *
 * Returns the actual amount claimed (may be less than requested if fund is empty).
 */
export function claimInsurance(
  fund: InsuranceFund,
  amount: number
): number {
  if (amount <= 0) throw new Error('Claim amount must be positive');

  const actualClaim = Math.min(amount, fund.balance);
  fund.balance -= actualClaim;
  fund.totalClaimed += actualClaim;
  return actualClaim;
}

/**
 * Check if admin can withdraw from the insurance fund.
 * Admin can only withdraw amounts above a minimum buffer.
 */
export function canAdminWithdraw(
  fund: InsuranceFund,
  amount: number,
  minBuffer: number = 10000 // Default: $10,000
): boolean {
  if (amount <= 0) return false;
  return fund.balance - amount >= minBuffer;
}

/**
 * Admin withdraw from insurance fund.
 * Only succeeds if the remaining balance stays above minBuffer.
 */
export function adminWithdraw(
  fund: InsuranceFund,
  amount: number,
  minBuffer: number = 10000
): boolean {
  if (!canAdminWithdraw(fund, amount, minBuffer)) return false;
  fund.balance -= amount;
  return true;
}
