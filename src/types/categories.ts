import { z } from 'zod';

export const CategoryEnum = z.enum([
  'single_room',
  'bedsitter',
  'student_room',
  'hostel',
  'one_bedroom',
  'two_bedroom',
  'three_bedroom',
  'hotel_room',
  'lodging_room',
  'guest_house',
  'farming_land',
  'plot',
  'office_space',
  'business_space',
]);

export type Category = z.infer<typeof CategoryEnum>;

export const NON_BOOKABLE_CATEGORIES: ReadonlySet<Category> = new Set([
  'farming_land',
  'plot',
]);

export function isCategoryBookable(category: Category): boolean {
  return !NON_BOOKABLE_CATEGORIES.has(category);
}
