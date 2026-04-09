/**
 * Users service adapter implementation
 */

import { BaseCrudAdapter } from './base-crud.adapter'
import { ApiRequestor } from './api-requestor'
import type {
	CreateUserInput,
	IUsersService,
	ManagedUser,
	PermissionCode,
	PaginatedResponse,
	UpdateUserInput,
	UserPermission,
	UsersListParams,
} from '../../contracts'

export class UsersAdapter
	extends BaseCrudAdapter<
		ManagedUser,
		UsersListParams,
		CreateUserInput,
		UpdateUserInput
	>
	implements IUsersService
{
	private permissionRequestor: ApiRequestor

	constructor(baseUrl: string) {
		super({
			endpoint: '/api/users/',
			baseUrl,
		})
		this.permissionRequestor = new ApiRequestor(baseUrl)
	}

	// User operations
	async listUsers(
		params?: UsersListParams,
	): Promise<PaginatedResponse<ManagedUser>> {
		return this.list(params)
	}

	async getUserById(id: string): Promise<ManagedUser> {
		return this.get(id)
	}

	async createUser(input: CreateUserInput): Promise<ManagedUser> {
		return this.create(input)
	}

	async updateUser(id: string, input: UpdateUserInput): Promise<ManagedUser> {
		return this.update(id, input)
	}

	async deleteUser(id: string): Promise<void> {
		return this.delete(id)
	}

	async toggleUserActive(id: string): Promise<ManagedUser> {
		return this.requestor.post<ManagedUser>(`${this.endpoint}${id}/toggle_active/`)
	}

	// Permission operations
	async listPermissions(): Promise<UserPermission[]> {
		return this.permissionRequestor.get<UserPermission[]>(
			'/api/users/permissions/',
		)
	}

	async listUserPermissions(userId: string): Promise<UserPermission[]> {
		const response = await this.permissionRequestor.get<UserPermission[]>(
			`/api/users/${userId}/permissions/`,
		)
		return response
	}

	async grantPermission(
		userId: string,
		permissionCode: PermissionCode,
	): Promise<void> {
		await this.permissionRequestor.post(`/api/users/${userId}/permissions/`, {
			permission_code: permissionCode,
		})
	}

	async revokePermission(
		userId: string,
		permissionCode: PermissionCode,
	): Promise<void> {
		await this.permissionRequestor.delete(
			`/api/users/${userId}/permissions/${permissionCode}/`,
		)
	}

	// Bulk operations
	async bulkUpdateUsers(
		ids: string[],
		input: UpdateUserInput,
	): Promise<ManagedUser[]> {
		return Promise.all(ids.map(id => this.updateUser(id, input)))
	}

	async bulkDeleteUsers(ids: string[]): Promise<void> {
		await Promise.all(ids.map(id => this.deleteUser(id)))
	}
}
