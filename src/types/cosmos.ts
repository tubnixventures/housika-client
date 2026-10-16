import { Category } from './categories';
import { PropertyStatus, UnitStatus, BookingStatus, PaymentStatus } from './status';

export interface PropertyDoc {
  id: string;
  docType: 'property';
  landlordId: string;
  country: string;
  location: string;
  exactLocation?: string | null;
  lat?: number | null;
  long?: number | null;
  videoKey?: string | null;
  title?: string;
  description?: string;
  paid: boolean;
  status: PropertyStatus;
  listingPaymentId?: string;
  voucherCode?: string;
  discountAmount?: number;
  grossListingFeeAmount?: number;
  payableAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnitDoc {
  id: string;
  docType: 'unit';
  propertyId: string;
  landlordId: string;
  country: string;
  unitNumber: string;
  category: Category;
  amount: number;
  period: string;
  currency: string;
  location: string;
  exactLocation?: string | null;
  lat?: number | null;
  long?: number | null;
  imageKeys?: string[];
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookingDoc {
  id: string;
  docType: 'booking';
  unitId: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  country: string;
  category: Category;
  currency: string;
  unitAmount: number;
  bookingFeeAmount: number;
  period?: string;
  paymentId?: string;
  status: BookingStatus;
  reminderSentAt?: string;
  voucherCode?: string;
  discountAmount?: number;
  grossBookingFeeAmount?: number;
  payableAmount?: number;
  paidAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
