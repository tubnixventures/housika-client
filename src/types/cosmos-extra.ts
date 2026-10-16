import { PaymentStatus } from './status';

export interface PaymentDoc {
  id: string;
  docType: 'payment';
  type: 'collection' | 'payout';
  purpose: 'listing_fee' | 'booking_fee';
  accountId: string;
  docId: string;
  reason: 'listing_fee' | 'booking_fee';
  amount: number;
  amountDisplay?: number;
  currency: string;
  country: string;
  gateway: 'paystack';
  gatewayRef: string;
  gatewayEventId?: string;
  authorizationUrl?: string;
  accessCode?: string;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  voucherCode?: string;
  discountAmount?: number;
  grossAmount?: number;
  payableAmount?: number;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptDoc {
  id: string;
  docType: 'receipt';
  landlordId: string;
  tenantName: string;
  tenantPhone?: string;
  amount: number;
  balance: number;
  paymentMethod: string;
  nextDue?: string | null;
  unitId?: string;
  propertyId?: string;
  bookingId?: string;
  verifyCode?: string;
  currency?: string;
  createdAt: string;
}

export interface ChatDoc {
  id: string;
  docType: 'chat';
  propertyId: string;
  unitId?: string;
  landlordId: string;
  A: string;
  B: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDoc {
  id: string;
  docType: 'message';
  chatId: string;
  senderId: string;
  body: string;
  attachmentKeys?: string[];
  createdAt: string;
  updatedAt: string;
}
