/**
 * Logs service adapter implementation
 */

import { ApiRequestor } from './api-requestor'
import type {
	ApiLog,
	AILog,
	ILogsService,
	LogsListParams,
	PaginatedResponse,
} from '../../contracts'

export class LogsAdapter implements ILogsService {
	private requestor: ApiRequestor

	constructor(baseUrl: string) {
		this.requestor = new ApiRequestor(baseUrl)
	}

	// API Logs
	async listApiLogs(
		params?: LogsListParams,
	): Promise<PaginatedResponse<ApiLog>> {
		return this.requestor.get<PaginatedResponse<ApiLog>>(
			'/api/logs/api/',
			params as Record<string, unknown>,
		)
	}

	async getApiLog(id: string): Promise<ApiLog> {
		return this.requestor.get<ApiLog>(`/api/logs/api/${id}/`)
	}

	// AI Logs
	async listAILogs(params?: LogsListParams): Promise<PaginatedResponse<AILog>> {
		return this.requestor.get<PaginatedResponse<AILog>>(
			'/api/logs/ai/',
			params as Record<string, unknown>,
		)
	}

	async getAILog(id: string): Promise<AILog> {
		return this.requestor.get<AILog>(`/api/logs/ai/${id}/`)
	}
}
