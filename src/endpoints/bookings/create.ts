import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireIndividual } from '../../middlewares/require-individual';
import { UnitDoc, BookingDoc } from '../../types/cosmos';
import { PaymentDoc } from '../../types/cosmos-extra';
import { cosmosRead, cosmosCreate } from '../../connectors/cosmos';
import { getCountryById } from '../../connectors/d1';
import { parseFeeJson, getBookingFeeMinor } from '../../helpers/fees';
import { isCategoryBookable } from '../../types/categories';
import { initPaystackTransaction } from '../../connectors/paystack';
import { generateId } from '../../helpers/ids';
import { jsonOk } from '../../helpers/response';
import { notFound, conflict, validationErr } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export const BookingCreateSchema = z.object({
  unitId: z.string().min(1),
  voucherCode: z.string().optional(),
});

export async function handleBookingCreate(req: Request, env: Env, auth: AuthContext): Promise<Response> {
  requireIndividual(auth);
  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (!idempotencyKey) validationErr('Idempotency-Key header is required');

  const body = await req.json();
  const parsed = BookingCreateSchema.parse(body);

  const unit = await cosmosRead<UnitDoc>(env, 'Units', '', parsed.unitId);
  if (!unit) notFound('Unit not found');
  if (unit.status !== 'available') conflict('Unit is not currently available for booking');
  if (!isCategoryBookable(unit.category)) {
    throw new (await import('../../helpers/errors')).AppError(
      ErrorCodes.CATEGORY_NOT_BOOKABLE,
      `Category ${unit.category} cannot be booked directly`,
      422
    );
  }
  if (unit.landlordId === auth.id) conflict('Cannot book your own unit');

  const countryData = await getCountryById(env, unit.country || auth.countryId);
  const feeTable = countryData?.booking_fee ? parseFeeJson(countryData.booking_fee) : { default: 100000 };
  const currency = countryData?.currency_code || unit.currency || 'KES';
  const bookingFeeMinor = getBookingFeeMinor(feeTable, unit.category);

  const bookingId = generateId('book');
  const payRef = generateId('payref');
  const nowIso = new Date().toISOString();

  const paystack = await initPaystackTransaction(env, {
    amount: bookingFeeMinor,
    email: auth.email,
    reference: payRef,
    currency,
    metadata: { purpose: 'booking_fee', bookingId, unitId: unit.id, tenantId: auth.id },
  });

  const paymentDoc: PaymentDoc = {
    id: generateId('pay'),
    docType: 'payment',
    type: 'collection',
    purpose: 'booking_fee',
    accountId: auth.id,
    docId: bookingId,
    reason: 'booking_fee',
    amount: bookingFeeMinor,
    currency,
    country: unit.country,
    gateway: 'paystack',
    gatewayRef: payRef,
    authorizationUrl: paystack.authorizationUrl,
    status: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await cosmosCreate(env, 'Payments', unit.country, paymentDoc);

  const bookingDoc: BookingDoc = {
    id: bookingId,
    docType: 'booking',
    unitId: unit.id,
    propertyId: unit.propertyId,
    tenantId: auth.id,
    landlordId: unit.landlordId,
    country: unit.country,
    category: unit.category,
    currency,
    unitAmount: unit.amount,
    bookingFeeAmount: bookingFeeMinor,
    status: 'pending_payment',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await cosmosCreate(env, 'Bookings', auth.id, bookingDoc);

  return jsonOk({
    bookingId,
    bookingFee: bookingFeeMinor,
    currency,
    authorizationUrl: paystack.authorizationUrl,
    reference: payRef,
  }, 'Booking created; complete payment to continue', 201);
}
