import { useEffect, useState } from 'react'

export const PAGE_SIZE = 10

export function usePagination<T>(items: T[], resetKey: string | number, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  const safePage = Math.min(page, totalPages)

  return {
    page: safePage,
    setPage,
    totalPages,
    total: items.length,
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
  }
}
