import { z } from 'zod';

export const PropertyStatusEnum = z.enum([
  'draft',
  'pending_payment',
  'pending_admin_approval',
  'active',
  'suspended',
  'archived',
]);
export type PropertyStatus = z.infer<typeof PropertyStatusEnum>;

export const UnitStatusEnum = z.enum([
  'draft',
  'pending_payment',
  'pending_admin_approval',
  'available',
  'unavailable',
  'reserved',
  'booked',
  'suspended',
  'archived',
]);
export type UnitStatus = z.infer<typeof UnitStatusEnum>;

export const BookingStatusEnum = z.enum([
  'draft',
  'pending_payment',
  'awaiting_landlord_approval',
  'booked',
  'rejected',
  'cancelled_by_tenant',
  'cancelled_by_landlord',
  'expired',
  'completed',
]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

export const PaymentStatusEnum = z.enum([
  'pending',
  'success',
  'failed',
  'abandoned',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;
