/**
 * Chat service adapter implementation
 */

import { ApiRequestor } from './api-requestor'
import type {
	ChatMessage,
	ChatMessagesListParams,
	ChatSession,
	ChatSessionsListParams,
	CreateMessageInput,
	IChatService,
	PaginatedResponse,
} from '../../contracts'

export class ChatAdapter implements IChatService {
	private requestor: ApiRequestor

	constructor(baseUrl: string) {
		this.requestor = new ApiRequestor(baseUrl)
	}

	async listSessions(
		params?: ChatSessionsListParams,
	): Promise<PaginatedResponse<ChatSession>> {
		return this.requestor.get<PaginatedResponse<ChatSession>>(
			'/api/chat/sessions/',
			params as Record<string, unknown>,
		)
	}

	async getSession(id: string): Promise<ChatSession> {
		return this.requestor.get<ChatSession>(`/api/chat/sessions/${id}/`)
	}

	async listMessages(
		sessionId: string,
		params?: ChatMessagesListParams,
	): Promise<PaginatedResponse<ChatMessage>> {
		return this.requestor.get<PaginatedResponse<ChatMessage>>(
			`/api/chat/sessions/${sessionId}/messages/`,
			params as Record<string, unknown>,
		)
	}

	async getMessages(sessionId: string): Promise<ChatMessage[]> {
		const response = await this.listMessages(sessionId)
		return response.items
	}

	async sendMessage(
		sessionId: string,
		input: CreateMessageInput,
	): Promise<ChatMessage> {
		return this.requestor.post<ChatMessage>(`/api/chat/messages/inbound/`, {
			...input,
			session_id: sessionId,
		})
	}

	subscribeToSession(
		sessionId: string,
		callback: (message: ChatMessage) => void,
	): () => void {
		// WebSocket implementation
		// This is a placeholder - actual implementation would use WebSocket
		try {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
			const wsUrl = `${protocol}//${window.location.host}/ws/chat/${sessionId}/`
			const ws = new WebSocket(wsUrl)

			ws.onmessage = (event: MessageEvent) => {
				try {
					const message = JSON.parse(event.data) as ChatMessage
					callback(message)
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error)
				}
			}

			// Return unsubscribe function
			return () => {
				ws.close()
			}
		} catch (error) {
			console.error('Failed to subscribe to session:', error)
			return () => {}
		}
	}
}
