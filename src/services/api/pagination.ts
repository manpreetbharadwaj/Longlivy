import type { AxiosRequestConfig } from 'axios';
import { apiRequestParsed } from './apiClient';
import { dataList, isRecord, num, RecordValue } from './laravel';
import { ApiError } from '@/utils/apiError';

export interface ApiPageMeta {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

function pageMeta(body: unknown): ApiPageMeta {
  if (!isRecord(body) || !isRecord(body.data) || !isRecord(body.data.meta)) throw new ApiError({ kind: 'malformed' });
  const meta = body.data.meta;
  const currentPage = num(meta.current_page);
  const perPage = num(meta.per_page);
  const total = num(meta.total);
  const lastPage = num(meta.last_page);
  if (currentPage === undefined || perPage === undefined || total === undefined || lastPage === undefined) throw new ApiError({ kind: 'malformed' });
  return { currentPage, perPage, total, lastPage };
}

/**
 * Loads every page for screens whose repository contract still returns a
 * complete array. Each request explicitly uses the documented page/per_page
 * parameters; ids are de-duplicated and a defensive bound prevents a bad
 * meta response from creating an endless request loop.
 */
export async function loadAllPages<T extends { id: string }>(
  config: AxiosRequestConfig,
  resourceKey: string,
  map: (raw: RecordValue) => T,
): Promise<T[]> {
  const byId = new Map<string, T>();
  let page = 1;
  let lastPage = 1;
  do {
    const result = await apiRequestParsed(
      { ...config, params: { ...(config.params ?? {}), page, per_page: 100 } },
      (body) => ({ items: dataList(body, resourceKey).map(map), meta: pageMeta(body) }),
    );
    for (const item of result.items) byId.set(item.id, item);
    lastPage = result.meta.lastPage;
    if (result.meta.currentPage !== page || lastPage < page || lastPage > 10_000) throw new ApiError({ kind: 'malformed' });
    page += 1;
  } while (page <= lastPage);
  return [...byId.values()];
}

export { pageMeta };
