/**
 * Regional Cylinder Standards Configuration
 * 
 * Defines configuration for gas cylinder standards across different regions
 * including India (PESO), US (DOT), EU (TPED), and Australia (AS)
 */

// ============================================================================
// REGIONAL CONFIGURATIONS
// ============================================================================

/**
 * Default region code (India/PESO)
 */
export const DEFAULT_REGION = 'IN';

/**
 * Regional configuration for gas cylinder standards
 */
export const REGIONAL_CONFIGS = {
    IN: {
        code: 'IN',
        name: 'India',
        regulatoryBody: 'PESO (Petroleum and Explosives Safety Organisation)',
        emergencyContact: '1800-233-4444',
        retestProviderUrl: 'https://peso.gov.in',
        dateFormat: 'DD/MM/YYYY',
        testIntervals: {
            lpgDomestic: { years: 5, months: 0 },
            lpgCommercial: { years: 5, months: 0 },
            industrial: { years: 3, months: 0 },
            medicalOxygen: { years: 3, months: 0 },
            cng: { years: 3, months: 0 },
            fireExtinguisher: { years: 1, months: 0 },
        },
        maxAge: {
            lpg: { years: 10, months: 0 },
            industrial: { years: 15, months: 0 },
            cng: { years: 15, months: 0 },
            fireExtinguisher: { years: 12, months: 0 },
        },
        dueSoonThresholdDays: 90,
    },
    US: {
        code: 'US',
        name: 'United States',
        regulatoryBody: 'DOT (Department of Transportation)',
        emergencyContact: '1-800-424-8802',
        retestProviderUrl: 'https://www.phmsa.dot.gov',
        dateFormat: 'MM/DD/YYYY',
        testIntervals: {
            lpgDomestic: { years: 5, months: 0 },
            lpgCommercial: { years: 5, months: 0 },
            industrial: { years: 5, months: 0 },
            medicalOxygen: { years: 5, months: 0 },
            cng: { years: 3, months: 0 },
            fireExtinguisher: { years: 1, months: 0 },
        },
        maxAge: {
            lpg: { years: 12, months: 0 },
            industrial: { years: 20, months: 0 },
            cng: { years: 20, months: 0 },
            fireExtinguisher: { years: 12, months: 0 },
        },
        dueSoonThresholdDays: 90,
    },
    EU: {
        code: 'EU',
        name: 'European Union',
        regulatoryBody: 'TPED (Transportable Pressure Equipment Directive)',
        emergencyContact: '112',
        retestProviderUrl: 'https://europa.eu',
        dateFormat: 'DD/MM/YYYY',
        testIntervals: {
            lpgDomestic: { years: 5, months: 0 },
            lpgCommercial: { years: 5, months: 0 },
            industrial: { years: 5, months: 0 },
            medicalOxygen: { years: 5, months: 0 },
            cng: { years: 3, months: 0 },
            fireExtinguisher: { years: 1, months: 0 },
        },
        maxAge: {
            lpg: { years: 15, months: 0 },
            industrial: { years: 20, months: 0 },
            cng: { years: 20, months: 0 },
            fireExtinguisher: { years: 20, months: 0 },
        },
        dueSoonThresholdDays: 90,
    },
    AS: {
        code: 'AS',
        name: 'Australia',
        regulatoryBody: 'AS (Standards Australia)',
        emergencyContact: '000',
        retestProviderUrl: 'https://standards.org.au',
        dateFormat: 'DD/MM/YYYY',
        testIntervals: {
            lpgDomestic: { years: 10, months: 0 },
            lpgCommercial: { years: 10, months: 0 },
            industrial: { years: 5, months: 0 },
            medicalOxygen: { years: 5, months: 0 },
            cng: { years: 3, months: 0 },
            fireExtinguisher: { years: 1, months: 0 },
        },
        maxAge: {
            lpg: { years: 15, months: 0 },
            industrial: { years: 20, months: 0 },
            cng: { years: 20, months: 0 },
            fireExtinguisher: { years: 20, months: 0 },
        },
        dueSoonThresholdDays: 90,
    },
};

// ============================================================================
// CYLINDER TYPES
// ============================================================================

/**
 * Cylinder type definitions with specifications and standards
 */
export const CYLINDER_TYPES = {
    // LPG Domestic Cylinders
    LPG_DOMESTIC_14_2KG: {
        id: 'LPG_DOMESTIC_14_2KG',
        category: 'LPG',
        subCategory: 'Domestic',
        name: 'LPG Domestic Cylinder 14.2kg',
        capacity: 14.2,
        capacityUnit: 'kg',
        standard: 'IS 3196',
        region: 'IN',
    },
    LPG_DOMESTIC_5KG: {
        id: 'LPG_DOMESTIC_5KG',
        category: 'LPG',
        subCategory: 'Domestic',
        name: 'LPG Domestic Cylinder 5kg',
        capacity: 5,
        capacityUnit: 'kg',
        standard: 'IS 3196',
        region: 'IN',
    },
    LPG_DOMESTIC_2KG: {
        id: 'LPG_DOMESTIC_2KG',
        category: 'LPG',
        subCategory: 'Domestic',
        name: 'LPG Domestic Cylinder 2kg',
        capacity: 2,
        capacityUnit: 'kg',
        standard: 'IS 3196',
        region: 'IN',
    },

    // LPG Commercial Cylinders
    LPG_COMMERCIAL_19KG: {
        id: 'LPG_COMMERCIAL_19KG',
        category: 'LPG',
        subCategory: 'Commercial',
        name: 'LPG Commercial Cylinder 19kg',
        capacity: 19,
        capacityUnit: 'kg',
        standard: 'IS 3196',
        region: 'IN',
    },
    LPG_COMMERCIAL_47_5KG: {
        id: 'LPG_COMMERCIAL_47_5KG',
        category: 'LPG',
        subCategory: 'Commercial',
        name: 'LPG Commercial Cylinder 47.5kg',
        capacity: 47.5,
        capacityUnit: 'kg',
        standard: 'IS 3196',
        region: 'IN',
    },

    // Industrial Gas Cylinders
    INDUSTRIAL_OXYGEN: {
        id: 'INDUSTRIAL_OXYGEN',
        category: 'Industrial',
        subCategory: 'Industrial Gas',
        name: 'Industrial Oxygen Cylinder',
        capacity: null,
        capacityUnit: 'm³',
        standard: 'IS 7285 / ISO 9809',
        region: 'IN',
    },
    INDUSTRIAL_NITROGEN: {
        id: 'INDUSTRIAL_NITROGEN',
        category: 'Industrial',
        subCategory: 'Industrial Gas',
        name: 'Industrial Nitrogen Cylinder',
        capacity: null,
        capacityUnit: 'm³',
        standard: 'IS 7285 / ISO 9809',
        region: 'IN',
    },
    INDUSTRIAL_ARGON: {
        id: 'INDUSTRIAL_ARGON',
        category: 'Industrial',
        subCategory: 'Industrial Gas',
        name: 'Industrial Argon Cylinder',
        capacity: null,
        capacityUnit: 'm³',
        standard: 'IS 7285 / ISO 9809',
        region: 'IN',
    },
    INDUSTRIAL_CO2: {
        id: 'INDUSTRIAL_CO2',
        category: 'Industrial',
        subCategory: 'Industrial Gas',
        name: 'Industrial CO2 Cylinder',
        capacity: null,
        capacityUnit: 'kg',
        standard: 'IS 7285 / ISO 9809',
        region: 'IN',
    },

    // Medical Oxygen
    MEDICAL_OXYGEN: {
        id: 'MEDICAL_OXYGEN',
        category: 'Medical',
        subCategory: 'Medical Gas',
        name: 'Medical Oxygen Cylinder',
        capacity: null,
        capacityUnit: 'm³',
        standard: 'IS 15671',
        region: 'IN',
    },

    // CNG Cylinders
    CNG_CYLINDER: {
        id: 'CNG_CYLINDER',
        category: 'CNG',
        subCategory: 'Fuel',
        name: 'CNG Cylinder',
        capacity: null,
        capacityUnit: 'm³',
        standard: 'AIS 024 / ISO 11439',
        region: 'IN',
    },

    // Fire Extinguishers
    FIRE_EXTINGUISHER: {
        id: 'FIRE_EXTINGUISHER',
        category: 'Fire Safety',
        subCategory: 'Fire Extinguisher',
        name: 'Fire Extinguisher',
        capacity: null,
        capacityUnit: 'kg',
        standard: 'IS 15683 / IS 16018',
        region: 'IN',
    },
};

/**
 * Get cylinder type by ID
 */
export const getCylinderType = (id) => CYLINDER_TYPES[id] || null;

/**
 * Get cylinder types by category
 */
export const getCylinderTypesByCategory = (category) => {
    return Object.values(CYLINDER_TYPES).filter(
        (type) => type.category === category
    );
};

// ============================================================================
// STATUS CODES
// ============================================================================

/**
 * Status codes for cylinder verification results
 */
export const STATUS_CODES = {
    VALID: {
        code: 'VALID',
        name: 'Valid',
        color: '#22C55E',
        description: 'Cylinder is within valid testing period',
        priority: 1,
    },
    DUE_SOON: {
        code: 'DUE_SOON',
        name: 'Due Soon',
        color: '#F59E0B',
        description: 'Test due within 90 days',
        priority: 2,
    },
    OVERDUE: {
        code: 'OVERDUE',
        name: 'Overdue',
        color: '#EF4444',
        description: 'Test date has passed',
        priority: 3,
    },
    EXPIRED: {
        code: 'EXPIRED',
        name: 'Expired',
        color: '#DC2626',
        description: 'Cylinder has exceeded maximum age',
        priority: 4,
    },
    UNKNOWN: {
        code: 'UNKNOWN',
        name: 'Unknown',
        color: '#6B7280',
        description: 'Unable to determine status',
        priority: 0,
    },
};

/**
 * Get status by code
 */
export const getStatusByCode = (code) => STATUS_CODES[code] || STATUS_CODES.UNKNOWN;

// ============================================================================
// SAFETY MESSAGES
// ============================================================================

/**
 * Safety messages for each status type
 */
export const SAFETY_MESSAGES = {
    [STATUS_CODES.VALID.code]: {
        title: 'Cylinder Verified',
        message: 'This cylinder is within its valid testing period and safe for use.',
        icon: 'checkmark-circle',
        color: STATUS_CODES.VALID.color,
        actionRequired: false,
    },
    [STATUS_CODES.DUE_SOON.code]: {
        title: 'Retest Required Soon',
        message: 'This cylinder\'s test date is approaching. Please schedule a retest within 90 days.',
        icon: 'warning',
        color: STATUS_CODES.DUE_SOON.color,
        actionRequired: true,
        actionText: 'Schedule Retest',
    },
    [STATUS_CODES.OVERDUE.code]: {
        title: 'Retest Overdue',
        message: 'This cylinder has passed its test date and must be retested immediately. Do not use until retested.',
        icon: 'alert-circle',
        color: STATUS_CODES.OVERDUE.color,
        actionRequired: true,
        actionText: 'Immediate Retest Required',
        severity: 'high',
    },
    [STATUS_CODES.EXPIRED.code]: {
        title: 'Cylinder Expired',
        message: 'This cylinder has exceeded its maximum service life and must be decommissioned immediately.',
        icon: 'close-circle',
        color: STATUS_CODES.EXPIRED.color,
        actionRequired: true,
        actionText: 'Decommission Cylinder',
        severity: 'critical',
    },
    [STATUS_CODES.UNKNOWN.code]: {
        title: 'Unable to Verify',
        message: 'Could not verify cylinder status. Please verify the cylinder number and test date manually.',
        icon: 'help-circle',
        color: STATUS_CODES.UNKNOWN.color,
        actionRequired: true,
        actionText: 'Manual Verification',
    },
};

/**
 * Get safety message by status code
 */
export const getSafetyMessage = (statusCode) => {
    return SAFETY_MESSAGES[statusCode] || SAFETY_MESSAGES[STATUS_CODES.UNKNOWN.code];
};

// ============================================================================
// CONFIDENCE THRESHOLDS
// ============================================================================

/**
 * Confidence thresholds for OCR and verification results
 */
export const CONFIDENCE_THRESHOLDS = {
    critical: {
        nextTestDate: 0.85,
        cylinderNumber: 0.80,
    },
    warning: 0.70,
    minimum: 0.50,
};

/**
 * Check if confidence meets critical threshold for specific field
 */
export const meetsCriticalThreshold = (field, confidence) => {
    const threshold = CONFIDENCE_THRESHOLDS.critical[field];
    return threshold ? confidence >= threshold : false;
};

/**
 * Check if confidence meets warning threshold
 */
export const meetsWarningThreshold = (confidence) => {
    return confidence >= CONFIDENCE_THRESHOLDS.warning;
};

/**
 * Check if confidence meets minimum threshold
 */
export const meetsMinimumThreshold = (confidence) => {
    return confidence >= CONFIDENCE_THRESHOLDS.minimum;
};

// ============================================================================
// IMAGE VALIDATION CONFIG
// ============================================================================

/**
 * Image validation configuration
 */
export const IMAGE_VALIDATION_CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
    minResolution: {
        width: 800,
        height: 600,
    },
    recommendedResolution: {
        width: 1920,
        height: 1080,
    },
    acceptedFormats: ['jpeg', 'jpg', 'png', 'heic'],
};

/**
 * Check if file size is valid
 */
export const isValidFileSize = (size) => {
    return size <= IMAGE_VALIDATION_CONFIG.maxFileSize;
};

/**
 * Check if resolution meets minimum requirements
 */
export const isValidResolution = (width, height) => {
    return (
        width >= IMAGE_VALIDATION_CONFIG.minResolution.width &&
        height >= IMAGE_VALIDATION_CONFIG.minResolution.height
    );
};

/**
 * Check if format is accepted
 */
export const isAcceptedFormat = (format) => {
    const normalizedFormat = format.toLowerCase().replace('.', '');
    return IMAGE_VALIDATION_CONFIG.acceptedFormats.includes(normalizedFormat);
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export containing all cylinder standards configuration
 */
const cylinderStandards = {
    DEFAULT_REGION,
    REGIONAL_CONFIGS,
    CYLINDER_TYPES,
    STATUS_CODES,
    SAFETY_MESSAGES,
    CONFIDENCE_THRESHOLDS,
    IMAGE_VALIDATION_CONFIG,
    getCylinderType,
    getCylinderTypesByCategory,
    getStatusByCode,
    getSafetyMessage,
    meetsCriticalThreshold,
    meetsWarningThreshold,
    meetsMinimumThreshold,
    isValidFileSize,
    isValidResolution,
    isAcceptedFormat,
};

export default cylinderStandards;
