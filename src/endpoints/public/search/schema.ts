import { z } from 'zod';
import { CategoryEnum } from '../../../types/categories';

export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  category: CategoryEnum.optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(25).default(20),
});

export type SearchQueryParams = z.infer<typeof SearchQuerySchema>;
