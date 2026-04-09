/**
 * Leads service contract
 */

import type {
	BaseEntity,
	CreateInput,
	ListParams,
	PaginatedResponse,
	UpdateInput,
} from './common.contracts'

export interface Lead extends BaseEntity {
	name: string
	email?: string
	phone?: string
	company?: string
	source?: string
	status?: string
	description?: string
	assigned_to?: string
	tags?: string[]
	metadata?: Record<string, unknown>
}

export interface CreateLeadInput extends CreateInput<Lead> {
	name: string
	email?: string
	phone?: string
}

export interface UpdateLeadInput extends UpdateInput<Lead> {}

export interface LeadsListParams extends ListParams {
	status?: string
	source?: string
	assigned_to?: string
	search?: string
}

export interface ILeadsService {
	// Read operations
	listLeads(params?: LeadsListParams): Promise<PaginatedResponse<Lead>>
	getLead(id: string): Promise<Lead>

	// Write operations
	createLead(input: CreateLeadInput): Promise<Lead>
	updateLead(id: string, input: UpdateLeadInput): Promise<Lead>
	deleteLead(id: string): Promise<void>

	// Bulk operations
	bulkUpdateLeads(ids: string[], input: UpdateLeadInput): Promise<Lead[]>
	bulkDeleteLeads(ids: string[]): Promise<void>
}
