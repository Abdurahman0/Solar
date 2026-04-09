/**
 * Contracts service adapter implementation
 */

import { BaseCrudAdapter } from './base-crud.adapter'
import { ApiRequestor } from './api-requestor'
import { getAccessToken } from '../../../lib/auth-storage'
import type {
	Contract,
	ContractsListParams,
	CreateContractInput,
	IContractsService,
	PaginatedResponse,
	UpdateContractInput,
} from '../../contracts'

export class ContractsAdapter
	extends BaseCrudAdapter<
		Contract,
		ContractsListParams,
		CreateContractInput,
		UpdateContractInput
	>
	implements IContractsService
{
	private fileRequestor: ApiRequestor
	private baseUrl: string

	constructor(baseUrl: string) {
		super({
			endpoint: '/api/contracts/',
			baseUrl,
		})
		this.fileRequestor = new ApiRequestor(baseUrl)
		this.baseUrl = baseUrl
	}

	async listContracts(
		params?: ContractsListParams,
	): Promise<PaginatedResponse<Contract>> {
		return this.list(params)
	}

	async getContract(id: string): Promise<Contract> {
		return this.get(id)
	}

	async createContract(
		input: CreateContractInput,
		file?: File,
	): Promise<Contract> {
		if (file) {
			return this.uploadWithFile(input, file, 'create')
		}
		return this.create(input)
	}

	async updateContract(
		id: string,
		input: UpdateContractInput,
		file?: File,
	): Promise<Contract> {
		if (file) {
			return this.uploadWithFile(input, file, 'update', id)
		}
		return this.update(id, input)
	}

	async deleteContract(id: string): Promise<void> {
		return this.delete(id)
	}

	async downloadFile(id: string): Promise<Blob> {
		const token = getAccessToken()
		const headers: Record<string, string> = {}
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		const response = await fetch(
			`${this.baseUrl}/api/contracts/${id}/download-file/`,
			{
				method: 'GET',
				headers,
			},
		)

		if (!response.ok) {
			throw new Error(`Failed to download file: ${response.statusText}`)
		}

		return response.blob()
	}

	async uploadFile(id: string, file: File): Promise<Contract> {
		const formData = new FormData()
		formData.append('file', file)

		const token = getAccessToken()
		const headers: Record<string, string> = {}
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		const response = await fetch(`${this.baseUrl}/api/contracts/${id}/`, {
			method: 'PATCH',
			headers,
			body: formData,
		})

		if (!response.ok) {
			throw new Error(`Failed to upload file: ${response.statusText}`)
		}

		return response.json() as Promise<Contract>
	}

	async recalculate(id: string): Promise<Contract> {
		return this.fileRequestor.post<Contract>(
			`/api/contracts/${id}/recalculate/`,
		)
	}

	async bulkUpdateContracts(
		ids: string[],
		input: UpdateContractInput,
	): Promise<Contract[]> {
		return Promise.all(ids.map(id => this.updateContract(id, input)))
	}

	async bulkDeleteContracts(ids: string[]): Promise<void> {
		await Promise.all(ids.map(id => this.deleteContract(id)))
	}

	private async uploadWithFile(
		input: CreateContractInput | UpdateContractInput,
		file: File,
		mode: 'create' | 'update',
		id?: string,
	): Promise<Contract> {
		const formData = new FormData()

		// Add form fields
		Object.entries(input).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				formData.append(key, String(value))
			}
		})

		// Add file
		formData.append('file', file)

		const token = getAccessToken()
		const headers: Record<string, string> = {}
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		const endpoint =
			mode === 'create' ? '/api/contracts/' : `/api/contracts/${id}/`
		const method = mode === 'create' ? 'POST' : 'PATCH'

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method,
			headers,
			body: formData,
		})

		if (!response.ok) {
			throw new Error(`Failed to upload contract: ${response.statusText}`)
		}

		return response.json() as Promise<Contract>
	}
}
