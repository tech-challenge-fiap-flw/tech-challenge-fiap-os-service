import { Request } from 'express';

export function getPagination(req: Request) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function toPage<T>(items: T[], page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { items, page, limit, count: items.length, total, totalPages };
}
