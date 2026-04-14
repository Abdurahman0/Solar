/**
 * API request utilities for adapters
 */

import type {
	ApiErrorResponse,
	PaginatedResponse,
	ServiceError,
} from '../../contracts'
import { ServiceError as ServiceErrorClass } from '../../contracts'
import { getAccessToken } from '../../../lib/auth-storage'
import { requestTokenRefresh } from '../../../lib/api-client'

export interface RequestConfig {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	headers?: Record<string, string>
	body?: unknown
	params?: Record<string, unknown>
	timeout?: number
	_retry?: boolean
}

export class ApiRequestor {
	constructor(private baseUrl: string) {}

	async request<T>(endpoint: string, config?: RequestConfig): Promise<T> {
		const url = new URL(endpoint, this.baseUrl)

		// Add query parameters
		if (config?.params) {
			Object.entries(config.params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value))
				}
			})
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'ngrok-skip-browser-warning': 'true',
			...config?.headers,
		}

		// Add authorization token
		const token = getAccessToken()
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		try {
			const fetchConfig: RequestInit = {
				method: config?.method || 'GET',
				headers,
				cache: 'no-store' as RequestCache,
				body: config?.body ? JSON.stringify(config.body) : undefined,
				signal: config?.timeout
					? AbortSignal.timeout(config.timeout)
					: undefined,
			}

			let response = await fetch(url.toString(), fetchConfig)

			if (response.status === 401 && !config?._retry) {
				const refreshedTokens = await requestTokenRefresh()
				if (refreshedTokens?.access) {
					// Retry with new token
					headers['Authorization'] = `Bearer ${refreshedTokens.access}`
					fetchConfig.headers = headers
					response = await fetch(url.toString(), fetchConfig)
				}
			}

			if (!response.ok) {
				const errorData = await this.parseErrorResponse(response)
				throw new ServiceErrorClass(
					response.status,
					errorData?.detail || errorData?.message || 'Request failed',
					errorData ?? undefined,
				)
			}

			// Handle 204 No Content
			if (response.status === 204) {
				return undefined as T
			}

			const json = await response.json()
			
			// Unwrap { status: 'success', data: ... } envelope if present
			if (
				json && 
				typeof json === 'object' && 
				!Array.isArray(json) && 
				(json as any).status === 'success' && 
				'data' in (json as any)
			) {
				return (json as any).data as T
			}

			return json as Promise<T>
		} catch (error) {
			if (error instanceof ServiceErrorClass) {
				throw error
			}

			throw new ServiceErrorClass(
				0,
				error instanceof Error ? error.message : 'Unknown error',
			)
		}
	}

	private async parseErrorResponse(
		response: Response,
	): Promise<ApiErrorResponse | null> {
		try {
			return (await response.json()) as ApiErrorResponse
		} catch {
			return null
		}
	}

	async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET', params })
	}

	async post<T>(
		endpoint: string,
		body?: unknown,
		params?: Record<string, unknown>,
	): Promise<T> {
		return this.request<T>(endpoint, { method: 'POST', body, params })
	}

	async put<T>(
		endpoint: string,
		body?: unknown,
		params?: Record<string, unknown>,
	): Promise<T> {
		return this.request<T>(endpoint, { method: 'PUT', body, params })
	}

	async patch<T>(
		endpoint: string,
		body?: unknown,
		params?: Record<string, unknown>,
	): Promise<T> {
		return this.request<T>(endpoint, { method: 'PATCH', body, params })
	}

	async delete<T>(
		endpoint: string,
		params?: Record<string, unknown>,
	): Promise<T> {
		return this.request<T>(endpoint, { method: 'DELETE', params })
	}

	async blob(endpoint: string, params?: Record<string, unknown>): Promise<Blob> {
		const url = new URL(endpoint, this.baseUrl)

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value))
				}
			})
		}

		const headers: Record<string, string> = {
			'ngrok-skip-browser-warning': 'true',
		}

		const token = getAccessToken()
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		const fetchConfig: RequestInit = {
			method: 'GET',
			headers,
			cache: 'no-store',
		}

		let response = await fetch(url.toString(), fetchConfig)

		if (response.status === 401) {
			const refreshedTokens = await requestTokenRefresh()
			if (refreshedTokens?.access) {
				headers['Authorization'] = `Bearer ${refreshedTokens.access}`
				fetchConfig.headers = headers
				response = await fetch(url.toString(), fetchConfig)
			}
		}

		if (!response.ok) {
			const errorData = await this.parseErrorResponse(response)
			throw new ServiceErrorClass(
				response.status,
				errorData?.detail || errorData?.message || 'Request failed',
				errorData ?? undefined,
			)
		}

		return response.blob()
	}
}
