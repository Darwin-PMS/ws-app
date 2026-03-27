// Context Index
// Centralized export for all context modules

export { AppProvider, useApp, USER_ROLES, ROLE_NAMES, AVAILABLE_MODELS, SYSTEM_PROMPTS } from './AppContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { MenuProvider, useMenu } from './MenuContext';
export { PermissionProvider, usePermission, usePermissions } from './PermissionContext';
export { ChildCareProvider, useChildCare } from './ChildCareContext';

// New Contexts (added for complete API integration)
export { SOSProvider, useSOS } from './SOSContext';
export { UserProvider, useUser } from './UserContext';
export { ConsentProvider, useConsent } from './ConsentContext';
export { FamilyPlacesProvider, useFamilyPlaces } from './FamilyPlacesContext';
export { EventProvider, useEvents } from './EventContext';
