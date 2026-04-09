import type { EntityId, TimestampString } from './common'

export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'archived'

export interface Client {
	id: EntityId
	name: string
	email?: string
	phone?: string
	status: ClientStatus
	metadata?: Record<string, unknown>
	createdAt: TimestampString
	updatedAt?: TimestampString
}

export interface ClientSummary {
	id: EntityId
	name: string
	email?: string
	phone?: string
}

export type ClientDto = Client

export interface ClientMutationInput {
	name: string
	email?: string
	phone?: string
	status?: ClientStatus
	metadata?: Record<string, unknown>
}

export interface ClientPatchInput {
	name?: string
	email?: string
	phone?: string
	status?: ClientStatus
	metadata?: Record<string, unknown>
}

export interface ClientListParams {
	page?: number
	pageSize?: number
	search?: string
	status?: ClientStatus
	ordering?: string
}
