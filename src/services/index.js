// Services Index
// Centralized export for all service modules

// API Client
export { apiClient } from './api/client';

// Feature Services
export { default as databaseService } from './databaseService';
export { default as authService } from './authService';
export { default as childCareService } from './childCareService';
export { default as familyService } from './familyService';
export { default as locationService } from './locationService';
export { default as homeAutomationService } from './homeAutomationService';
export { default as thoughtService } from './thoughtService';
export { default as contextService } from './contextService';
export { default as aiService } from './aiService';
export { default as settingsService } from './settingsService';
export { default as menuService } from './menuService';
export { default as permissionService } from './permissionService';
export { default as themeService } from './themeService';

// New Services (added for complete API integration)
export { default as userService } from './userService';
export { default as sosService } from './sosService';
export { default as consentService } from './consentService';
export { default as familyPlacesService } from './familyPlacesService';
export { default as eventService } from './eventService';

// Safety Services
export { default as safetyService } from './safetyService';
export { default as fakeCallService } from './fakeCallService';
export { default as fakeMessageService } from './fakeMessageService';
export { default as fakeBatteryService } from './fakeBatteryService';
export { default as safeRouteService } from './safeRouteService';
export { default as behaviorAnalysisService } from './behaviorAnalysisService';
export { default as safetyTutorialService } from './safetyTutorialService';
export { default as safetyNewsService } from './safetyNewsService';
export { default as safetyLawService } from './safetyLawService';

// Live Stream Service
export { default as liveStreamService } from './liveStreamService';

// Banner Service
export { default as bannerService } from './bannerService';

// External APIs
export * from './groqApi';

// Offline Service
export { default as offlineService } from './offlineService';

// Device & Battery Intelligence Services
export { default as batteryService } from './batteryService';
export { default as signalService } from './signalService';

// Biometric Authentication
export { default as biometricService } from './biometricService';

// Voice Keyword Detection
export { default as voiceKeywordService } from './voiceKeywordService';

// Volume Button Trigger
export { default as volumeButtonService } from './volumeButtonService';

// Logger
export { default as loggerService } from './loggerService';
