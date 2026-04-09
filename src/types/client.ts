import type { EntityId, TimestampString } from './common'

export type ClientStatus =
	| 'new'
	| 'contacted'
	| 'qualified'
	| 'need_follow_up'
	| 'proposal_preparing'
	| 'proposal_sent'
	| 'negotiation'
	| 'waiting_for_decision'
	| 'won'
	| 'lost'
	| 'postponed'

export type ClientSourcePlatform = 'instagram' | 'manual' | 'telegram'

export interface Client {
	id: EntityId
	lead?: EntityId | null
	leadId?: EntityId | null
	fullName: string
	phone?: string
	region?: string
	address?: string
	objectType?: string
	customerSegment?: string
	electricityConsumption?: string
	monthlyBill?: string | number
	solutionType?: string
	budgetRange?: string
	sourcePlatform?: ClientSourcePlatform
	status: ClientStatus
	manager?: EntityId | null
	managerUsername?: string
	notes?: string
	aiSummary?: string
	metadata?: Record<string, unknown>
	createdAt: TimestampString
	updatedAt?: TimestampString
}

export interface ClientSummary {
	id: EntityId
	fullName: string
	phone?: string
}

export type ClientDto = Client

export interface ClientMutationInput {
	lead?: EntityId | null
	full_name: string
	phone?: string
	region?: string
	address?: string
	object_type?: string
	customer_segment?: string
	electricity_consumption?: string
	monthly_bill?: string | number
	solution_type?: string
	budget_range?: string
	source_platform?: ClientSourcePlatform
	status?: ClientStatus
	manager?: EntityId | null
	notes?: string
	ai_summary?: string
	metadata?: Record<string, unknown>
}

export interface ClientPatchInput {
	lead?: EntityId | null
	full_name?: string
	phone?: string
	region?: string
	address?: string
	object_type?: string
	customer_segment?: string
	electricity_consumption?: string
	monthly_bill?: string | number
	solution_type?: string
	budget_range?: string
	source_platform?: ClientSourcePlatform
	status?: ClientStatus
	manager?: EntityId | null
	notes?: string
	ai_summary?: string
	metadata?: Record<string, unknown>
}

export interface ClientListParams {
	page?: number
	pageSize?: number
	search?: string
	status?: ClientStatus
	sourcePlatform?: ClientSourcePlatform
	customerSegment?: string
	manager?: EntityId
	region?: string
	ordering?: string
}
