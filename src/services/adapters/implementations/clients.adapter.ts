/**
 * Clients service adapter implementation
 */

import { BaseCrudAdapter } from './base-crud.adapter'
import type {
	Client,
	ClientsListParams,
	CreateClientInput,
	IClientsService,
	PaginatedResponse,
	UpdateClientInput,
} from '../../contracts'

export class ClientsAdapter
	extends BaseCrudAdapter<
		Client,
		ClientsListParams,
		CreateClientInput,
		UpdateClientInput
	>
	implements IClientsService
{
	constructor(baseUrl: string) {
		super({
			endpoint: '/api/clients/',
			baseUrl,
		})
	}

	async listClients(
		params?: ClientsListParams,
	): Promise<PaginatedResponse<Client>> {
		return this.list(params)
	}

	async getClient(id: string): Promise<Client> {
		return this.get(id)
	}

	async createClient(input: CreateClientInput): Promise<Client> {
		return this.create(input)
	}

	async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
		return this.update(id, input)
	}

	async deleteClient(id: string): Promise<void> {
		return this.delete(id)
	}

	async bulkUpdateClients(
		ids: string[],
		input: UpdateClientInput,
	): Promise<Client[]> {
		return Promise.all(ids.map(id => this.updateClient(id, input)))
	}

	async bulkDeleteClients(ids: string[]): Promise<void> {
		await Promise.all(ids.map(id => this.deleteClient(id)))
	}
}
