/**
 * Clients service contract
 */

import type {
	BaseEntity,
	CreateInput,
	ListParams,
	PaginatedResponse,
	UpdateInput,
} from './common.contracts'

export interface Client extends BaseEntity {
	name: string
	email?: string
	phone?: string
	company?: string
	address?: string
	city?: string
	country?: string
	postal_code?: string
	type?: string
	status?: 'active' | 'inactive' | 'archived'
	assigned_to?: string
	tags?: string[]
	metadata?: Record<string, unknown>
}

export interface CreateClientInput extends CreateInput<Client> {
	name: string
	email?: string
	phone?: string
}

export interface UpdateClientInput extends UpdateInput<Client> {}

export interface ClientsListParams extends ListParams {
	status?: string
	type?: string
	assigned_to?: string
	search?: string
	country?: string
}

export interface IClientsService {
	// Read operations
	listClients(params?: ClientsListParams): Promise<PaginatedResponse<Client>>
	getClient(id: string): Promise<Client>

	// Write operations
	createClient(input: CreateClientInput): Promise<Client>
	updateClient(id: string, input: UpdateClientInput): Promise<Client>
	deleteClient(id: string): Promise<void>

	// Bulk operations
	bulkUpdateClients(ids: string[], input: UpdateClientInput): Promise<Client[]>
	bulkDeleteClients(ids: string[]): Promise<void>
}
