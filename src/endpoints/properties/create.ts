import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { PropertyCreateSchema } from './create-schema';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { computeTotalListingFeeMinor, parseFeeJson } from '../../helpers/fees';
import { getCountryById } from '../../connectors/d1';
import { initPaystackTransaction } from '../../connectors/paystack';
import { cosmosCreate, cosmosDelete } from '../../connectors/cosmos';
import { PropertyDoc, UnitDoc } from '../../types/cosmos';
import { PaymentDoc } from '../../types/cosmos-extra';
import { generateId } from '../../helpers/ids';
import { spreadPropertyToUnit } from '../../helpers/property-spread';
import { jsonOk } from '../../helpers/response';
import { validationErr } from '../../helpers/errors';

export async function handlePropertyCreate(req: Request, env: Env, auth: AuthContext): Promise<Response> {
  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (!idempotencyKey) validationErr('Idempotency-Key header is required');

  const body = await req.json();
  const parsed = PropertyCreateSchema.parse(body);
  const landlordId = resolveLandlordId(auth);
  const countryData = await getCountryById(env, auth.countryId);
  const feeTable = countryData?.listing_fee ? parseFeeJson(countryData.listing_fee) : { default: 250000 };
  const currency = countryData?.currency_code || 'KES';
  const grossFee = computeTotalListingFeeMinor(feeTable, parsed.units.map(u => u.category));

  const propertyId = generateId('prop');
  const nowIso = new Date().toISOString();
  const propDoc: PropertyDoc = {
    id: propertyId,
    docType: 'property',
    landlordId,
    country: auth.countryId,
    location: parsed.location,
    exactLocation: parsed.exactLocation || null,
    lat: parsed.lat || null,
    long: parsed.long || null,
    videoKey: parsed.videoKey || null,
    title: parsed.title,
    description: parsed.description,
    paid: false,
    status: 'pending_payment',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const unitDocs: UnitDoc[] = parsed.units.map(u => spreadPropertyToUnit(propDoc, currency, u, nowIso));
  const writtenUnitIds: string[] = [];

  try {
    await cosmosCreate(env, 'Properties', auth.countryId, propDoc);
    for (const u of unitDocs) {
      await cosmosCreate(env, 'Units', auth.countryId, u);
      writtenUnitIds.push(u.id);
    }
  } catch (err) {
    for (const id of writtenUnitIds) await cosmosDelete(env, 'Units', auth.countryId, id);
    await cosmosDelete(env, 'Properties', auth.countryId, propertyId);
    throw err;
  }

  const payRef = generateId('payref');
  const paystack = await initPaystackTransaction(env, {
    amount: grossFee,
    email: auth.email,
    reference: payRef,
    currency,
    metadata: { purpose: 'listing_fee', propertyId, landlordId, country: auth.countryId },
  });

  const paymentDoc: PaymentDoc = {
    id: generateId('pay'),
    docType: 'payment',
    type: 'collection',
    purpose: 'listing_fee',
    accountId: auth.id,
    docId: propertyId,
    reason: 'listing_fee',
    amount: grossFee,
    currency,
    country: auth.countryId,
    gateway: 'paystack',
    gatewayRef: payRef,
    authorizationUrl: paystack.authorizationUrl,
    status: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await cosmosCreate(env, 'Payments', auth.countryId, paymentDoc);

  return jsonOk({
    propertyId,
    unitIds: unitDocs.map(u => u.id),
    listingFee: grossFee,
    currency,
    authorizationUrl: paystack.authorizationUrl,
    reference: payRef,
  }, 'Property and units created; complete payment to submit for review', 201);
}
