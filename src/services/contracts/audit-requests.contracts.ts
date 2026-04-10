import type {
	BaseEntity,
	ListParams,
	PaginatedResponse,
} from './common.contracts'

export type AuditRequestStatus =
	| 'new'
	| 'moderation'
	| 'published'
	| 'paid'
	| 'conclusion_given'

export interface AuditRequest extends BaseEntity {
	client: string
	client_name: string
	contract: string
	contract_title: string
	requested_power_kw: number
	status: AuditRequestStatus
	contact_phone: string
	site_address: string
	notes: string
	conclusion: string
}

export interface CreateAuditRequestInput {
	client: string
	contract: string
	requested_power_kw: number
	status?: AuditRequestStatus
	contact_phone?: string
	site_address?: string
	notes?: string
	conclusion?: string
}

export interface UpdateAuditRequestInput {
	client?: string
	contract?: string
	requested_power_kw?: number
	status?: AuditRequestStatus
	contact_phone?: string
	site_address?: string
	notes?: string
	conclusion?: string
}

export interface AuditRequestsListParams extends ListParams {
	client?: string
	contract?: string
	requested_power_kw?: number
	status?: AuditRequestStatus
	search?: string
}

export interface IAuditRequestsService {
	listAuditRequests(
		params?: AuditRequestsListParams,
	): Promise<PaginatedResponse<AuditRequest>>
	getAuditRequest(id: string): Promise<AuditRequest>
	createAuditRequest(input: CreateAuditRequestInput): Promise<AuditRequest>
	updateAuditRequest(
		id: string,
		input: UpdateAuditRequestInput,
	): Promise<AuditRequest>
	deleteAuditRequest(id: string): Promise<void>
	bulkUpdateAuditRequests(
		ids: string[],
		input: UpdateAuditRequestInput,
	): Promise<AuditRequest[]>
	bulkDeleteAuditRequests(ids: string[]): Promise<void>
}
