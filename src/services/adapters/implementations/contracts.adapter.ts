/**
 * Contracts service adapter implementation
 */

import { BaseCrudAdapter } from './base-crud.adapter'
import { ApiRequestor } from './api-requestor'
import { getAccessToken } from '../../../lib/auth-storage'
import type {
	Contract,
	CreateInput,
	ContractsListParams,
	CreateContractInput,
	IContractsService,
	PaginatedResponse,
	PricingMatrixData,
	UpdateInput,
	UpdateContractInput,
} from '../../contracts'

function toRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}

	return value as Record<string, unknown>
}

function parseListResponse(
	data: unknown,
	params?: ContractsListParams,
): PaginatedResponse<Contract> {
	const payload = toRecord(data) ?? {}
	const results = Array.isArray(payload.results)
		? payload.results
		: Array.isArray(payload.items)
			? payload.items
			: []
	const items = results as Contract[]
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

export class ContractsAdapter
	extends BaseCrudAdapter<
		Contract,
		ContractsListParams,
		CreateInput<Contract>,
		UpdateInput<Contract>
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
		const data = await this.requestor.get<unknown>(
			this.endpoint,
			params as Record<string, unknown>,
		)
		return parseListResponse(data, params)
	}

	async getContract(id: string): Promise<Contract> {
		return this.get(id)
	}

	async createContract(
		input: CreateContractInput,
		file?: File | null,
	): Promise<Contract> {
		if (file || input.file || input.cadastre_file || input.house_image) {
			return this.uploadWithFile(input, file ?? undefined, 'create')
		}
		return this.create(input as CreateInput<Contract>)
	}

	async updateContract(
		id: string,
		input: UpdateContractInput,
		file?: File | null,
	): Promise<Contract> {
		if (file || input.file || input.cadastre_file || input.house_image) {
			return this.uploadWithFile(input, file ?? undefined, 'update', id)
		}
		return this.update(id, input as UpdateInput<Contract>)
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

	async getDownloadFileInfo(id: string): Promise<Contract> {
		return this.fileRequestor.get<Contract>(`/api/contracts/${id}/download-file/`)
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

	async recalculate(id: string, input?: UpdateContractInput): Promise<Contract> {
		return this.fileRequestor.post<Contract>(
			`/api/contracts/${id}/recalculate/`,
			input ?? {},
		)
	}

	async getPricingMatrix(): Promise<PricingMatrixData> {
		const data = await this.fileRequestor.get<unknown>('/api/contracts/pricing-matrix/')

		const payload = toRecord(data)
		const root = toRecord(payload?.data) ?? payload

		const subsidyPercent =
			typeof root?.subsidy_percent === 'string'
				? root.subsidy_percent
				: String(root?.subsidy_percent ?? '0')
		const supportedAuditPowers = Array.isArray(root?.supported_audit_powers)
			? root.supported_audit_powers.filter(
					power => typeof power === 'number' && Number.isFinite(power),
				)
			: []
		const panels = Array.isArray(root?.panels) ? root.panels : []

		return {
			subsidy_percent: subsidyPercent,
			supported_audit_powers: supportedAuditPowers,
			panels: panels as PricingMatrixData['panels'],
		}
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
		file: File | undefined,
		mode: 'create' | 'update',
		id?: string,
	): Promise<Contract> {
		const formData = new FormData()

		// Add form fields
		Object.entries(input).forEach(([key, value]) => {
			if (
				key === 'file' ||
				key === 'cadastre_file' ||
				key === 'house_image'
			) {
				return
			}
			if (value !== undefined && value !== null) {
				if (key === 'items' && Array.isArray(value)) {
					formData.append(key, JSON.stringify(value))
					return
				}
				formData.append(key, String(value))
			}
		})

		if (file) {
			formData.append('file', file)
		}
		if (input.file instanceof File) {
			formData.append('file', input.file)
		}
		if (input.cadastre_file instanceof File) {
			formData.append('cadastre_file', input.cadastre_file)
		}
		if (input.house_image instanceof File) {
			formData.append('house_image', input.house_image)
		}

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
