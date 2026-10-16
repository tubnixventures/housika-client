import { Env } from '../types/env';
import { AuthContext } from '../types/auth';
import { handleBookingCreate } from '../endpoints/bookings/create';
import { handleBookingsMeList } from '../endpoints/bookings/me-list';
import { handleBookingsMeDetail } from '../endpoints/bookings/me-detail';
import { handleBookingsMeCancel } from '../endpoints/bookings/me-cancel';
import { handleLandlordBookingsList } from '../endpoints/bookings/landlord-list';
import { handleLandlordBookingApprove } from '../endpoints/bookings/landlord-approve';
import { handleLandlordBookingReject } from '../endpoints/bookings/landlord-reject';

export async function matchBookingRoutes(
  req: Request,
  env: Env,
  auth: AuthContext,
  path: string
): Promise<Response | null> {
  const method = req.method;
  if (path === '/client/api/v1/bookings' && method === 'POST') {
    return await handleBookingCreate(req, env, auth);
  }
  if (path === '/client/api/v1/bookings/me' && method === 'GET') {
    return await handleBookingsMeList(req, env, auth);
  }
  if (path.startsWith('/client/api/v1/bookings/me/') && path.endsWith('/cancel') && method === 'POST') {
    const bookingId = path.split('/')[5];
    return await handleBookingsMeCancel(req, env, auth, bookingId);
  }
  if (path.startsWith('/client/api/v1/bookings/me/') && method === 'GET') {
    const bookingId = path.split('/')[5];
    return await handleBookingsMeDetail(req, env, auth, bookingId);
  }
  if (path === '/client/api/v1/landlord/bookings' && method === 'GET') {
    return await handleLandlordBookingsList(req, env, auth);
  }
  if (path.startsWith('/client/api/v1/landlord/bookings/') && path.endsWith('/approve') && method === 'POST') {
    const bookingId = path.split('/')[5];
    return await handleLandlordBookingApprove(req, env, auth, bookingId);
  }
  if (path.startsWith('/client/api/v1/landlord/bookings/') && path.endsWith('/reject') && method === 'POST') {
    const bookingId = path.split('/')[5];
    return await handleLandlordBookingReject(req, env, auth, bookingId);
  }
  return null;
}
