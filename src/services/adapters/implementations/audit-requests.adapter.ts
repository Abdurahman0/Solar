import { BaseCrudAdapter } from './base-crud.adapter'
import type {
	AuditRequest,
	AuditRequestsListParams,
	CreateAuditRequestInput,
	IAuditRequestsService,
	PaginatedResponse,
	UpdateAuditRequestInput,
} from '../../contracts'

function toRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}

	return value as Record<string, unknown>
}

function parseListResponse(
	data: unknown,
	params?: AuditRequestsListParams,
): PaginatedResponse<AuditRequest> {
	const payload = toRecord(data) ?? {}
	const results = Array.isArray(payload.results)
		? payload.results
		: Array.isArray(payload.items)
			? payload.items
			: []
	const items = results as AuditRequest[]
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

export class AuditRequestsAdapter
	extends BaseCrudAdapter<
		AuditRequest,
		AuditRequestsListParams,
		CreateAuditRequestInput,
		UpdateAuditRequestInput
	>
	implements IAuditRequestsService
{
	constructor(baseUrl: string) {
		super({
			endpoint: '/api/contracts/audit-requests/',
			baseUrl,
		})
	}

	async listAuditRequests(
		params?: AuditRequestsListParams,
	): Promise<PaginatedResponse<AuditRequest>> {
		const data = await this.requestor.get<unknown>(
			this.endpoint,
			params as Record<string, unknown>,
		)
		return parseListResponse(data, params)
	}

	async getAuditRequest(id: string): Promise<AuditRequest> {
		return this.get(id)
	}

	async createAuditRequest(input: CreateAuditRequestInput): Promise<AuditRequest> {
		return this.create(input)
	}

	async updateAuditRequest(
		id: string,
		input: UpdateAuditRequestInput,
	): Promise<AuditRequest> {
		return this.update(id, input)
	}

	async deleteAuditRequest(id: string): Promise<void> {
		return this.delete(id)
	}

	async bulkUpdateAuditRequests(
		ids: string[],
		input: UpdateAuditRequestInput,
	): Promise<AuditRequest[]> {
		return Promise.all(ids.map(id => this.updateAuditRequest(id, input)))
	}

	async bulkDeleteAuditRequests(ids: string[]): Promise<void> {
		await Promise.all(ids.map(id => this.deleteAuditRequest(id)))
	}
}
