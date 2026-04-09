/**
 * Services singleton - Convenient access to service registry
 * This provides a simple $variable for importing services across the app
 */

import { getServices } from './registry'
import { apiConversationService } from './api/conversation-service'
import { apiProductService } from './api/product-service'
import { apiDashboardService } from './api/dashboard-service'
import { apiNotificationService } from './api/notification-service'
import { apiIntegrationsService } from './api/integrations.service'
import { apiAISettingsService } from './api/ai-settings.service'
import { apiLogsService } from './api/common.service'

const coreServices = getServices()
const conversationApi = apiConversationService as any
const productApi = apiProductService as any
const dashboardApi = apiDashboardService as any
const notificationApi = apiNotificationService as any
const integrationsApi = apiIntegrationsService as any
const aiSettingsApi = apiAISettingsService as any
const logsApi = apiLogsService as any

export const services = {
	...coreServices,
	dashboard: {
		getDashboardOverview: dashboardApi.getOverview.bind(dashboardApi),
	} as any,
	chat: {
		listSessions: conversationApi.listSessions.bind(conversationApi),
		getSessionById: conversationApi.getSessionById.bind(conversationApi),
		listMessages: conversationApi.listMessages.bind(conversationApi),
		sendMessage: conversationApi.sendMessage.bind(conversationApi),
	} as any,
	notifications: {
		listNotifications: notificationApi.listNotifications.bind(notificationApi),
		getNotificationById: notificationApi.getNotificationById.bind(notificationApi),
		getNotification: notificationApi.getNotificationById.bind(notificationApi),
		markAsRead: notificationApi.markNotificationRead.bind(notificationApi),
		markAllAsRead: notificationApi.markAllRead.bind(notificationApi),
		clearAll: notificationApi.deleteAll.bind(notificationApi),
	} as any,
	integrations: {
		listConfigs: integrationsApi.listIntegrationConfigs.bind(integrationsApi),
		getConfigById: integrationsApi.getIntegrationConfigById.bind(integrationsApi),
		getConfig: integrationsApi.getIntegrationConfigById.bind(integrationsApi),
		createConfig: integrationsApi.createIntegrationConfig.bind(integrationsApi),
		updateConfig: integrationsApi.updateIntegrationConfig.bind(integrationsApi),
		patchConfig: integrationsApi.patchIntegrationConfig.bind(integrationsApi),
		deleteConfig: integrationsApi.deleteIntegrationConfig.bind(integrationsApi),
		listEvents: integrationsApi.listIntegrationEvents.bind(integrationsApi),
		getEventById: integrationsApi.getIntegrationEventById.bind(integrationsApi),
		getEvent: integrationsApi.getIntegrationEventById.bind(integrationsApi),
	} as any,
	aiSettings: {
		listSettings: aiSettingsApi.listAISettings.bind(aiSettingsApi),
		getSettingById: aiSettingsApi.getAISettingById.bind(aiSettingsApi),
		getSetting: aiSettingsApi.getAISettingById.bind(aiSettingsApi),
		getActiveSetting: aiSettingsApi.getActiveAISetting.bind(aiSettingsApi),
		createSetting: aiSettingsApi.createAISetting.bind(aiSettingsApi),
		updateSetting: aiSettingsApi.updateAISetting.bind(aiSettingsApi),
		patchSetting: aiSettingsApi.patchAISetting.bind(aiSettingsApi),
		deleteSetting: aiSettingsApi.deleteAISetting.bind(aiSettingsApi),
		setActiveSetting: aiSettingsApi.setActiveAISetting.bind(aiSettingsApi),
	} as any,
	logs: {
		getHealth: logsApi.getHealth.bind(logsApi),
		listLogs: logsApi.listLogs.bind(logsApi),
		getLogById: logsApi.getLogById.bind(logsApi),
		getApiLog: logsApi.getLogById.bind(logsApi),
		getCleanupSettings: logsApi.getCleanupSettings.bind(logsApi),
		updateCleanupSettings: logsApi.patchCleanupSettings.bind(logsApi),
	} as any,
	products: {
		...productApi,
		...coreServices.products,
	} as any,
}
