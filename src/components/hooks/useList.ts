/**
 * useList - Custom hook for paginated list data fetching
 */

import { useEffect, useState, useCallback } from 'react'
import type {
	ListParams,
	PaginatedResponse,
	ServiceError,
} from '../../services/contracts'

export interface UseListOptions<P extends ListParams = ListParams> {
	params?: P
	autoFetch?: boolean
	pollInterval?: number
}

export interface UseListState<T> {
	items: T[]
	total: number
	isLoading: boolean
	error: ServiceError | null
	hasMore: boolean
	pageInfo: {
		page?: number
		pageSize?: number
		total: number
	}
}

export interface UseListActions<T, P extends ListParams = ListParams> {
	fetch: (params?: P) => Promise<void>
	setPage: (page: number) => void
	setPageSize: (size: number) => void
	refresh: () => Promise<void>
	reset: () => void
	append: (items: T[]) => void
	clear: () => void
}

export function useList<T, P extends ListParams = ListParams>(
	fetcher: (params?: P) => Promise<PaginatedResponse<T>>,
	options?: UseListOptions<P>,
): [UseListState<T>, UseListActions<T, P>] {
	const [state, setState] = useState<UseListState<T>>({
		items: [],
		total: 0,
		isLoading: false,
		error: null,
		hasMore: false,
		pageInfo: { page: 1, pageSize: 20, total: 0 },
	})

	const [params, setParams] = useState<P>(options?.params || ({} as P))

	const fetch = useCallback(
		async (fetchParams?: P) => {
			setState(prev => ({ ...prev, isLoading: true, error: null }))
			try {
				const response = await fetcher(fetchParams || params)
				setState(prev => ({
					...prev,
					items: response.items,
					total: response.total || response.items.length,
					hasMore: !!response.next,
					pageInfo: {
						page: response.page || 1,
						pageSize: response.page_size || response.items.length,
						total: response.total || 0,
					},
				}))
			} catch (error) {
				setState(prev => ({
					...prev,
					error: error instanceof Error ? (error as any) : null,
				}))
			} finally {
				setState(prev => ({ ...prev, isLoading: false }))
			}
		},
		[fetcher, params],
	)

	const setPage = useCallback((page: number) => {
		setParams(prev => ({ ...prev, page }) as P)
	}, [])

	const setPageSize = useCallback((pageSize: number) => {
		setParams(prev => ({ ...prev, page_size: pageSize, page: 1 }) as P)
	}, [])

	const refresh = useCallback(() => fetch(params), [fetch, params])

	const reset = useCallback(() => {
		setState({
			items: [],
			total: 0,
			isLoading: false,
			error: null,
			hasMore: false,
			pageInfo: { page: 1, pageSize: 20, total: 0 },
		})
		setParams(options?.params || ({} as P))
	}, [options?.params])

	const append = useCallback((items: T[]) => {
		setState(prev => ({
			...prev,
			items: [...prev.items, ...items],
			total: prev.total + items.length,
		}))
	}, [])

	const clear = useCallback(() => {
		setState(prev => ({
			...prev,
			items: [],
		}))
	}, [])

	// Auto-fetch on mount or param change
	useEffect(() => {
		if (options?.autoFetch !== false) {
			fetch(params)
		}
	}, [fetch, params, options?.autoFetch])

	// Setup polling if requested
	useEffect(() => {
		if (!options?.pollInterval) return

		const interval = setInterval(() => {
			fetch(params)
		}, options.pollInterval)

		return () => clearInterval(interval)
	}, [fetch, params, options?.pollInterval])

	return [
		state,
		{
			fetch,
			setPage,
			setPageSize,
			refresh,
			reset,
			append,
			clear,
		},
	]
}
