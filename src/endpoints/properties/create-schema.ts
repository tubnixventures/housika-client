import { z } from 'zod';
import { CategoryEnum } from '../../types/categories';

export const PropertyUnitInputSchema = z.object({
  unitNumber: z.string().min(1),
  category: CategoryEnum,
  amount: z.number().int().positive(),
  period: z.enum(['night', 'week', 'month', 'year', 'sale']),
  imageKeys: z.array(z.string()).optional(),
});

export const PropertyCreateSchema = z.object({
  location: z.string().min(2),
  exactLocation: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  long: z.number().min(-180).max(180).optional(),
  videoKey: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  voucherCode: z.string().optional(),
  units: z.array(PropertyUnitInputSchema).min(1),
});

export type PropertyCreateInput = z.infer<typeof PropertyCreateSchema>;
