import { BaseCrudAdapter } from './base-crud.adapter'
import type {
	AuditRequest,
	AuditRequestsListParams,
	CreateAuditRequestInput,
	IAuditRequestsService,
	PaginatedResponse,
	UpdateAuditRequestInput,
} from '../../contracts'



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
		return this.list(params)
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
