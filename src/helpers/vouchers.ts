import { validationErr } from './errors';

export interface VoucherRecord {
  code: string;
  voucher_type: 'percentage' | 'fixed_amount' | 'free_listing' | 'free_booking';
  value: number;
  remaining_value?: number | null;
  currency: string;
  max_uses?: number | null;
  used_count: number;
  applicable_to: 'listing_fee' | 'booking_fee' | 'all';
  country_id?: string | null;
  status: string;
  starts_at: number;
  ends_at: number;
}

export interface VoucherRedemptionResult {
  voucherApplied: boolean;
  voucherCode?: string;
  grossAmount: number;
  discountAmount: number;
  payableAmount: number;
}

export function calculateVoucherDiscount(
  voucher: VoucherRecord,
  purpose: 'listing_fee' | 'booking_fee',
  countryId: string,
  grossAmountMinor: number
): VoucherRedemptionResult {
  const nowSec = Math.floor(Date.now() / 1000);
  if (voucher.status !== 'active') validationErr('Voucher is not active');
  if (nowSec < voucher.starts_at || nowSec > voucher.ends_at) validationErr('Voucher has expired');
  if (voucher.applicable_to !== 'all' && voucher.applicable_to !== purpose) {
    validationErr(`Voucher is not applicable to ${purpose}`);
  }
  if (voucher.country_id && voucher.country_id !== countryId) {
    validationErr('Voucher is not valid in this country');
  }
  if (voucher.max_uses != null && voucher.used_count >= voucher.max_uses) {
    validationErr('Voucher usage limit reached');
  }

  let discount = 0;
  if (voucher.voucher_type === 'percentage') {
    discount = Math.floor((grossAmountMinor * voucher.value) / 100);
  } else if (voucher.voucher_type === 'fixed_amount') {
    const availableVal = voucher.remaining_value ?? voucher.value;
    discount = Math.min(Math.round(availableVal), grossAmountMinor);
  } else if (
    (voucher.voucher_type === 'free_listing' && purpose === 'listing_fee') ||
    (voucher.voucher_type === 'free_booking' && purpose === 'booking_fee')
  ) {
    discount = grossAmountMinor;
  }

  discount = Math.min(discount, grossAmountMinor);
  return {
    voucherApplied: true,
    voucherCode: voucher.code,
    grossAmount: grossAmountMinor,
    discountAmount: discount,
    payableAmount: grossAmountMinor - discount,
  };
}
