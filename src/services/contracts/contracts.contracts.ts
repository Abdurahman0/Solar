/**
 * Contracts service contract
 */

import type {
	BaseEntity,
	CreateInput,
	ListParams,
	PaginatedResponse,
	UpdateInput,
} from './common.contracts'

export interface Contract extends BaseEntity {
	title: string
	description?: string
	client_id?: string
	status?: 'draft' | 'active' | 'completed' | 'cancelled'
	contract_date?: string
	start_date?: string
	end_date?: string
	amount?: number
	currency?: string
	file_url?: string
	file_name?: string
	assigned_to?: string
	tags?: string[]
	metadata?: Record<string, unknown>
}

export interface CreateContractInput extends CreateInput<Contract> {
	title: string
}

export interface UpdateContractInput extends UpdateInput<Contract> {}

export interface ContractsListParams extends ListParams {
	status?: string
	client_id?: string
	assigned_to?: string
	search?: string
}

export interface IContractsService {
	// Read operations
	listContracts(
		params?: ContractsListParams,
	): Promise<PaginatedResponse<Contract>>
	getContract(id: string): Promise<Contract>

	// Write operations
	createContract(input: CreateContractInput, file?: File): Promise<Contract>
	updateContract(
		id: string,
		input: UpdateContractInput,
		file?: File,
	): Promise<Contract>
	deleteContract(id: string): Promise<void>

	// File operations
	downloadFile(id: string): Promise<Blob>
	uploadFile(id: string, file: File): Promise<Contract>

	// Business operations
	recalculate(id: string): Promise<Contract>

	// Bulk operations
	bulkUpdateContracts(
		ids: string[],
		input: UpdateContractInput,
	): Promise<Contract[]>
	bulkDeleteContracts(ids: string[]): Promise<void>
}
