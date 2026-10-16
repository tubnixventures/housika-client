import { Env } from '../types/env';
import { Category, CategoryEnum } from '../types/categories';

export interface StructuredSearchFilters {
  category?: Category;
  minAmount?: number;
  maxAmount?: number;
  locationHint?: string;
  country?: string;
}

export async function parseSearchWithAi(
  env: Env,
  query: string
): Promise<StructuredSearchFilters> {
  const q = query.trim().toLowerCase();
  const filters: StructuredSearchFilters = {};

  for (const cat of CategoryEnum.options) {
    const formatted = cat.replace(/_/g, ' ');
    if (q.includes(formatted) || q.includes(cat)) {
      filters.category = cat;
      break;
    }
  }

  const budgetMatch = q.match(/under\s+(\d+)|below\s+(\d+)|max\s+(\d+)/);
  if (budgetMatch) {
    const val = parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3], 10);
    if (!isNaN(val)) filters.maxAmount = val;
  }

  const minMatch = q.match(/above\s+(\d+)|min\s+(\d+)|from\s+(\d+)/);
  if (minMatch) {
    const val = parseInt(minMatch[1] || minMatch[2] || minMatch[3], 10);
    if (!isNaN(val)) filters.minAmount = val;
  }

  const inMatch = q.match(/in\s+([a-zA-Z\s]+)/);
  if (inMatch && inMatch[1]) {
    filters.locationHint = inMatch[1].trim();
  }

  return filters;
}
