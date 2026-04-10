import { apiClient } from '../../lib/api-client'
import type {
	Client,
	ClientsListParams,
	CreateClientInput,
	PaginatedResponse,
	UpdateClientInput,
} from '../contracts'

function toRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}

	return value as Record<string, unknown>
}

function parseListResponse(data: unknown, params?: ClientsListParams): PaginatedResponse<Client> {
	const payload = toRecord(data) ?? {}
	const resultsRaw = Array.isArray(payload.results)
		? payload.results
		: Array.isArray(payload.items)
			? payload.items
			: []
	const items = resultsRaw as Client[]
	const count = typeof payload.count === 'number' ? payload.count : items.length

	return {
		items,
		total: count,
		page: params?.page,
		page_size: params?.page_size,
		count,
		next: typeof payload.next === 'string' ? payload.next : null,
		previous: typeof payload.previous === 'string' ? payload.previous : null,
	}
}

function normalizePayload(input: CreateClientInput | UpdateClientInput): Record<string, unknown> {
	const payload: Record<string, unknown> = {}

	const keys: (keyof UpdateClientInput)[] = [
		'lead',
		'full_name',
		'phone',
		'region',
		'address',
		'object_type',
		'customer_segment',
		'electricity_consumption',
		'monthly_bill',
		'solution_type',
		'budget_range',
		'source_platform',
		'status',
		'manager',
		'notes',
		'ai_summary',
		'metadata',
	]

	for (const key of keys) {
		if (input[key] !== undefined) {
			payload[key] = input[key]
		}
	}

	return payload
}

export const apiClientService = {
	async listClients(params?: ClientsListParams): Promise<PaginatedResponse<Client>> {
		const { data } = await apiClient.get('/api/clients/', {
			params: {
				page: params?.page,
				page_size: params?.page_size,
				search: params?.search,
				status: params?.status,
				source_platform: params?.source_platform,
				customer_segment: params?.customer_segment,
				manager: params?.manager,
				region: params?.region,
				ordering: params?.ordering,
			},
		})

		return parseListResponse(data, params)
	},

	async getClient(id: string): Promise<Client> {
		const { data } = await apiClient.get<Client>(`/api/clients/${id}/`)
		return data
	},

	async createClient(input: CreateClientInput): Promise<Client> {
		const { data } = await apiClient.post<Client>('/api/clients/', normalizePayload(input))
		return data
	},

	async bulkImportClient(input: CreateClientInput): Promise<Client> {
		const { data } = await apiClient.post<Client>(
			'/api/clients/bulk-import/',
			normalizePayload(input),
		)
		return data
	},

	async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
		const { data } = await apiClient.put<Client>(`/api/clients/${id}/`, normalizePayload(input))
		return data
	},

	async patchClient(id: string, input: UpdateClientInput): Promise<Client> {
		const { data } = await apiClient.patch<Client>(`/api/clients/${id}/`, normalizePayload(input))
		return data
	},

	async deleteClient(id: string): Promise<void> {
		await apiClient.delete(`/api/clients/${id}/`)
	},

	async exportClients(): Promise<Client[]> {
		const { data } = await apiClient.get<unknown>('/api/clients/export/')
		if (Array.isArray(data)) {
			return data as Client[]
		}

		return data ? [data as Client] : []
	},
}
