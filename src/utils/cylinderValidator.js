/**
 * Cylinder Validation Utility
 * 
 * Provides date parsing, status determination, validation rules,
 * and error handling for gas cylinder verification.
 */

// Import constants from cylinderStandards
import {
    REGIONAL_CONFIGS,
    STATUS_CODES,
    CONFIDENCE_THRESHOLDS,
    IMAGE_VALIDATION_CONFIG,
    DEFAULT_REGION,
} from '../constants/cylinderStandards';

// ============================================================================
// DATE PARSING FUNCTIONS
// ============================================================================

/**
 * Parse various date formats and return Date object
 * Supports: MM/YY, MMM YYYY, MM/YYYY, DD/MM/YYYY, MM/DD/YYYY
 * @param {string} dateString - Date string in various formats
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export const parseDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
        return null;
    }

    const cleanedDate = dateString.trim();

    // Try MM/YY format (two-digit year)
    const mmYYMatch = cleanedDate.match(/^(\d{1,2})\/(\d{2})$/);
    if (mmYYMatch) {
        const month = parseInt(mmYYMatch[1], 10);
        const year = parseInt(mmYYMatch[2], 10);
        // Assume 20xx for years <= 50, 19xx for years > 50
        const fullYear = year <= 50 ? 2000 + year : 1900 + year;
        const date = new Date(fullYear, month - 1, 1);
        // Set to end of month for test dates
        date.setMonth(date.getMonth() + 12);
        date.setDate(0);
        return isValidDate(date) ? date : null;
    }

    // Try MMM YYYY format (e.g., "Jan 2025", "JAN 2025")
    const mmmYYYYMatch = cleanedDate.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    if (mmmYYYYMatch) {
        const monthStr = mmmYYYYMatch[1];
        const year = parseInt(mmmYYYYMatch[2], 10);
        const monthIndex = getMonthIndex(monthStr);
        if (monthIndex !== -1) {
            const date = new Date(year, monthIndex, 1);
            date.setMonth(date.getMonth() + 12);
            date.setDate(0);
            return isValidDate(date) ? date : null;
        }
    }

    // Try MM/YYYY format
    const mmYYYYMatch = cleanedDate.match(/^(\d{1,2})\/(\d{4})$/);
    if (mmYYYYMatch) {
        const month = parseInt(mmYYYYMatch[1], 10);
        const year = parseInt(mmYYYYMatch[2], 10);
        if (month >= 1 && month <= 12) {
            const date = new Date(year, month - 1, 1);
            date.setMonth(date.getMonth() + 12);
            date.setDate(0);
            return isValidDate(date) ? date : null;
        }
    }

    // Try DD/MM/YYYY format
    const ddmmYYYYMatch = cleanedDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmYYYYMatch) {
        const day = parseInt(ddmmYYYYMatch[1], 10);
        const month = parseInt(ddmmYYYYMatch[2], 10);
        const year = parseInt(ddmmYYYYMatch[3], 10);
        const date = new Date(year, month - 1, day);
        return isValidDate(date) ? date : null;
    }

    // Try MM/DD/YYYY format
    const mmddYYYYMatch = cleanedDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddYYYYMatch) {
        const month = parseInt(mmddYYYYMatch[1], 10);
        const day = parseInt(mmddYYYYMatch[2], 10);
        const year = parseInt(mmddYYYYMatch[3], 10);
        const date = new Date(year, month - 1, day);
        return isValidDate(date) ? date : null;
    }

    // Try ISO format (YYYY-MM-DD)
    const isoMatch = cleanedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        const date = new Date(year, month - 1, day);
        return isValidDate(date) ? date : null;
    }

    // Try native Date parsing as fallback
    const fallbackDate = new Date(cleanedDate);
    return isValidDate(fallbackDate) ? fallbackDate : null;
};

/**
 * Helper to check if a date is valid
 * @param {Date} date - Date object to validate
 * @returns {boolean}
 */
const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Get month index from month name
 * @param {string} monthStr - Month name (3 letters)
 * @returns {number} Month index (0-11) or -1 if invalid
 */
const getMonthIndex = (monthStr) => {
    const months = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    const normalized = monthStr.toLowerCase().substring(0, 3);
    return months.indexOf(normalized);
};

/**
 * Format date for display
 * @param {Date} date - Date object to format
 * @param {string} format - Format string (DD/MM/YYYY, MM/DD/YYYY, etc.)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const pad = (n) => n.toString().padStart(2, '0');

    switch (format) {
        case 'DD/MM/YYYY':
            return `${pad(day)}/${pad(month)}/${year}`;
        case 'MM/DD/YYYY':
            return `${pad(month)}/${pad(day)}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${pad(month)}-${pad(day)}`;
        case 'MMM YYYY':
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[month - 1]} ${year}`;
        case 'MMMM YYYY':
            const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            return `${fullMonthNames[month - 1]} ${year}`;
        case 'MM/YY':
            return `${pad(month)}/${year.toString().slice(-2)}`;
        case 'MM/YYYY':
            return `${pad(month)}/${year}`;
        default:
            return `${pad(day)}/${pad(month)}/${year}`;
    }
};

/**
 * Calculate days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days (positive if date2 > date1)
 */
export const calculateDaysDifference = (date1, date2) => {
    if (!date1 || !date2 || !(date1 instanceof Date) || !(date2 instanceof Date)) {
        return null;
    }

    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

// ============================================================================
// STATUS DETERMINATION LOGIC
// ============================================================================

/**
 * Determine cylinder status based on next test date and current date
 * @param {Date} nextTestDate - The next test date
 * @param {Date} currentDate - Current date (defaults to now)
 * @param {object} thresholds - Custom thresholds (optional)
 * @returns {string} Status code (VALID, DUE_SOON, OVERDUE, EXPIRED, UNKNOWN)
 */
export const determineStatus = (nextTestDate, currentDate = new Date(), thresholds = {}) => {
    if (!nextTestDate || !(nextTestDate instanceof Date) || isNaN(nextTestDate.getTime())) {
        return STATUS_CODES.UNKNOWN.code;
    }

    if (!(currentDate instanceof Date) || isNaN(currentDate.getTime())) {
        currentDate = new Date();
    }

    const dueSoonThreshold = thresholds.dueSoonThresholdDays || 90;
    const daysUntilTest = calculateDaysDifference(currentDate, nextTestDate);

    if (daysUntilTest === null) {
        return STATUS_CODES.UNKNOWN.code;
    }

    if (daysUntilTest < 0) {
        return STATUS_CODES.OVERDUE.code;
    }

    if (daysUntilTest <= dueSoonThreshold) {
        return STATUS_CODES.DUE_SOON.code;
    }

    return STATUS_CODES.VALID.code;
};

/**
 * Main function to evaluate cylinder status
 * @param {object} extractedData - Extracted data from OCR
 * @param {string} regionCode - Region code (IN, US, EU, AS)
 * @returns {ValidationResult} Complete validation result
 */
export const evaluateCylinderStatus = (extractedData, regionCode = DEFAULT_REGION) => {
    const regionConfig = REGIONAL_CONFIGS[regionCode] || REGIONAL_CONFIGS[DEFAULT_REGION];
    const currentDate = new Date();

    // Initialize result
    const result = {
        isValid: false,
        status: STATUS_CODES.UNKNOWN.code,
        daysUntilTest: null,
        daysOverdue: null,
        recommendedAction: '',
        priority: 'low',
        remarks: '',
        errors: [],
        warnings: [],
    };

    // Validate next test date exists
    if (!extractedData.nextTestDate) {
        result.errors.push({
            field: 'nextTestDate',
            message: 'Next test date is missing or invalid',
            code: 'MISSING_TEST_DATE',
        });
        result.remarks = 'Unable to determine status without test date';
        result.recommendedAction = 'Please verify the test date on the cylinder';
        return result;
    }

    // Parse the test date
    const parsedDate = parseDate(extractedData.nextTestDate);
    if (!parsedDate) {
        result.errors.push({
            field: 'nextTestDate',
            message: `Could not parse test date: ${extractedData.nextTestDate}`,
            code: 'INVALID_DATE_FORMAT',
        });
        result.remarks = 'Unable to parse the test date format';
        result.recommendedAction = 'Please verify the test date on the cylinder';
        return result;
    }

    // Determine status
    const status = determineStatus(parsedDate, currentDate, {
        dueSoonThresholdDays: regionConfig.dueSoonThresholdDays,
    });
    result.status = status;

    // Calculate days
    const daysDiff = calculateDaysDifference(currentDate, parsedDate);
    if (daysDiff !== null) {
        if (daysDiff >= 0) {
            result.daysUntilTest = daysDiff;
        } else {
            result.daysOverdue = Math.abs(daysDiff);
        }
    }

    // Set priority based on status
    const statusInfo = STATUS_CODES[status];
    result.priority = getPriorityFromStatus(status);

    // Generate remarks and recommended action
    const { remarks, recommendedAction, warnings } = generateStatusMessages(
        status,
        result.daysUntilTest,
        result.daysOverdue,
        regionConfig
    );
    result.remarks = remarks;
    result.recommendedAction = recommendedAction;
    result.warnings = warnings;

    // Determine overall validity
    result.isValid = status === STATUS_CODES.VALID.code || status === STATUS_CODES.DUE_SOON.code;

    return result;
};

/**
 * Get priority from status code
 * @param {string} status - Status code
 * @returns {string} Priority level
 */
const getPriorityFromStatus = (status) => {
    switch (status) {
        case STATUS_CODES.VALID.code:
            return 'low';
        case STATUS_CODES.DUE_SOON.code:
            return 'medium';
        case STATUS_CODES.OVERDUE.code:
            return 'high';
        case STATUS_CODES.EXPIRED.code:
            return 'critical';
        default:
            return 'low';
    }
};

/**
 * Generate status messages based on cylinder status
 * @param {string} status - Status code
 * @param {number|null} daysUntilTest - Days until test date
 * @param {number|null} daysOverdue - Days overdue
 * @param {object} regionConfig - Region configuration
 * @returns {object} Remarks, recommended action, and warnings
 */
const generateStatusMessages = (status, daysUntilTest, daysOverdue, regionConfig) => {
    const remarks = [];
    const warnings = [];
    let recommendedAction = '';

    switch (status) {
        case STATUS_CODES.VALID.code:
            remarks.push('Cylinder is within valid testing period');
            recommendedAction = 'No immediate action required';
            break;

        case STATUS_CODES.DUE_SOON.code:
            remarks.push(`Test due in ${daysUntilTest} days`);
            warnings.push(`Please schedule retest within ${regionConfig.dueSoonThresholdDays} days`);
            recommendedAction = 'Schedule retest at earliest convenience';
            break;

        case STATUS_CODES.OVERDUE.code:
            remarks.push(`Test overdue by ${daysOverdue} days`);
            warnings.push('Cylinder should not be used until retested');
            recommendedAction = 'Immediate retest required - Do not use cylinder';
            break;

        case STATUS_CODES.EXPIRED.code:
            remarks.push('Cylinder has exceeded maximum service life');
            warnings.push('Cylinder must be decommissioned immediately');
            recommendedAction = 'Decommission cylinder - Contact authorized dealer';
            break;

        default:
            remarks.push('Unable to determine cylinder status');
            recommendedAction = 'Manual verification required';
    }

    return {
        remarks: remarks.join('. '),
        recommendedAction,
        warnings,
    };
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

// Manufacturer codes mapping
const MANUFACTURER_CODES = {
    // Indian manufacturers
    'BP': 'Bharat Petroleum Corporation Limited',
    'BPCL': 'Bharat Petroleum Corporation Limited',
    'IOC': 'Indian Oil Corporation Limited',
    'IOCL': 'Indian Oil Corporation Limited',
    'HO': 'Indian Oil Corporation Limited (Haldia Oil Refinery)',
    'HPC': 'Hindustan Petroleum Corporation Limited',
    'HPCL': 'Hindustan Petroleum Corporation Limited',
    'GAIL': 'GAIL (India) Limited',
    'IGL': 'Indraprastha Gas Limited',
    'MGL': 'Maharashtra Natural Gas Limited',
    'SGML': 'Sabarmati Gas Limited',
    'CGDN': 'City Gas Distribution Network',

    // International manufacturers
    'WORTHINGTON': 'Worthington Industries',
    'LUXFER': 'Luxfer Gas Cylinders',
    'TIMAS': 'Timas SpA',
    'RINOX': 'Rinox GmbH',
    'FABER': 'Faber Industries',
};

/**
 * Supported gas types
 */
const SUPPORTED_GAS_TYPES = [
    'LPG',
    'PROPANE',
    'BUTANE',
    'OXYGEN',
    'MEDICAL OXYGEN',
    'NITROGEN',
    'ARGON',
    'CO2',
    'CARBON DIOXIDE',
    'HELIUM',
    'HYDROGEN',
    'ACETYLENE',
    'CNG',
    'NATURAL GAS',
    'FIRE EXTINGUISHER',
    'ABC',
    'CO2_EXTINGUISHER',
    'WATER_EXTINGUISHER',
    'FOAM_EXTINGUISHER',
];

/**
 * Valid capacity ranges for different cylinder types
 */
const CAPACITY_RANGES = {
    LPG: { min: 0.5, max: 50, unit: 'kg' },
    OXYGEN: { min: 0.5, max: 300, unit: 'm³' },
    NITROGEN: { min: 0.5, max: 300, unit: 'm³' },
    ARGON: { min: 0.5, max: 300, unit: 'm³' },
    CO2: { min: 0.5, max: 50, unit: 'kg' },
    CNG: { min: 0.5, max: 300, unit: 'm³' },
    FIRE_EXTINGUISHER: { min: 0.5, max: 150, unit: 'kg' },
    DEFAULT: { min: 0.1, max: 500, unit: 'units' },
};

/**
 * Validate cylinder number format
 * @param {string} cylinderNumber - Cylinder number to validate
 * @returns {ValidationError|null} Error object or null if valid
 */
export const validateCylinderNumber = (cylinderNumber) => {
    if (!cylinderNumber || typeof cylinderNumber !== 'string') {
        return {
            field: 'cylinderNumber',
            message: 'Cylinder number is required',
            code: 'MISSING_CYLINDER_NUMBER',
        };
    }

    const cleaned = cylinderNumber.trim().toUpperCase();

    // Check length (8-20 alphanumeric characters)
    if (cleaned.length < 8 || cleaned.length > 20) {
        return {
            field: 'cylinderNumber',
            message: `Cylinder number must be 8-20 characters (got ${cleaned.length})`,
            code: 'INVALID_CYLINDER_NUMBER_LENGTH',
        };
    }

    // Check alphanumeric (allows alphanumeric with optional dashes/spaces)
    const alphanumericPattern = /^[A-Z0-9\s\-]+$/;
    if (!alphanumericPattern.test(cleaned)) {
        return {
            field: 'cylinderNumber',
            message: 'Cylinder number must contain only letters and numbers',
            code: 'INVALID_CYLINDER_NUMBER_FORMAT',
        };
    }

    return null;
};

/**
 * Validate manufacturer code
 * @param {string} manufacturerCode - Manufacturer code to validate
 * @returns {ValidationError|null} Error object or null if valid
 */
export const validateManufacturerCode = (manufacturerCode) => {
    if (!manufacturerCode || typeof manufacturerCode !== 'string') {
        // Manufacturer code is optional
        return null;
    }

    const cleaned = manufacturerCode.trim().toUpperCase();

    // Check if manufacturer code is known
    const knownCodes = Object.keys(MANUFACTURER_CODES);
    const isKnownCode = knownCodes.some(code =>
        cleaned === code || cleaned.includes(code)
    );

    if (!isKnownCode && cleaned.length > 0) {
        return {
            field: 'manufacturerCode',
            message: `Unknown manufacturer code: ${cleaned}`,
            code: 'UNKNOWN_MANUFACTURER',
        };
    }

    return null;
};

/**
 * Validate gas type
 * @param {string} gasType - Gas type to validate
 * @returns {ValidationError|null} Error object or null if valid
 */
export const validateGasType = (gasType) => {
    if (!gasType || typeof gasType !== 'string') {
        return {
            field: 'gasType',
            message: 'Gas type is required',
            code: 'MISSING_GAS_TYPE',
        };
    }

    const cleaned = gasType.trim().toUpperCase();
    const normalizedGasType = cleaned.replace(/[\s\-_]+/g, ' ');

    const isSupported = SUPPORTED_GAS_TYPES.some(supported =>
        normalizedGasType.includes(supported) || supported.includes(normalizedGasType)
    );

    if (!isSupported) {
        return {
            field: 'gasType',
            message: `Unsupported gas type: ${gasType}. Supported: ${SUPPORTED_GAS_TYPES.join(', ')}`,
            code: 'UNSUPPORTED_GAS_TYPE',
        };
    }

    return null;
};

/**
 * Validate cylinder capacity
 * @param {number} capacity - Capacity value
 * @param {string} gasType - Gas type (for determining range)
 * @returns {ValidationError|null} Error object or null if valid
 */
export const validateCapacity = (capacity, gasType = '') => {
    if (capacity === null || capacity === undefined) {
        // Capacity is optional
        return null;
    }

    const capacityNum = parseFloat(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
        return {
            field: 'capacity',
            message: 'Capacity must be a positive number',
            code: 'INVALID_CAPACITY',
        };
    }

    // Determine range based on gas type
    const gasTypeUpper = gasType.toUpperCase();
    let range = CAPACITY_RANGES.DEFAULT;

    if (gasTypeUpper.includes('LPG')) {
        range = CAPACITY_RANGES.LPG;
    } else if (gasTypeUpper.includes('OXYGEN') || gasTypeUpper.includes('MEDICAL')) {
        range = CAPACITY_RANGES.OXYGEN;
    } else if (gasTypeUpper.includes('NITROGEN')) {
        range = CAPACITY_RANGES.NITROGEN;
    } else if (gasTypeUpper.includes('ARGON')) {
        range = CAPACITY_RANGES.ARGON;
    } else if (gasTypeUpper.includes('CO2') || gasTypeUpper.includes('CARBON')) {
        range = CAPACITY_RANGES.CO2;
    } else if (gasTypeUpper.includes('CNG') || gasTypeUpper.includes('NATURAL')) {
        range = CAPACITY_RANGES.CNG;
    } else if (gasTypeUpper.includes('FIRE') || gasTypeUpper.includes('EXTINGUISHER')) {
        range = CAPACITY_RANGES.FIRE_EXTINGUISHER;
    }

    if (capacityNum < range.min || capacityNum > range.max) {
        return {
            field: 'capacity',
            message: `Capacity ${capacityNum} ${range.unit} is outside expected range (${range.min}-${range.max} ${range.unit})`,
            code: 'CAPACITY_OUT_OF_RANGE',
        };
    }

    return null;
};

/**
 * Get manufacturer name from code
 * @param {string} code - Manufacturer code
 * @returns {string|null} Manufacturer name or null if not found
 */
export const getManufacturerName = (code) => {
    if (!code) return null;
    const cleaned = code.trim().toUpperCase();
    return MANUFACTURER_CODES[cleaned] || null;
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Error code to user-friendly message mapping
 */
const ERROR_MESSAGES = {
    // Date parsing errors
    'INVALID_DATE_FORMAT': 'The date format could not be recognized. Please verify the test date on the cylinder.',
    'MISSING_TEST_DATE': 'The test date was not found in the image. Please capture a clearer image.',
    'DATE_PARSE_FAILED': 'Could not parse the date. Please verify the test date manually.',

    // Validation errors
    'MISSING_CYLINDER_NUMBER': 'Cylinder number is missing. Please ensure the cylinder number is visible.',
    'INVALID_CYLINDER_NUMBER_LENGTH': 'Cylinder number length is incorrect. Expected 8-20 characters.',
    'INVALID_CYLINDER_NUMBER_FORMAT': 'Cylinder number contains invalid characters.',
    'UNKNOWN_MANUFACTURER': 'The manufacturer code is not recognized. Please verify manually.',
    'MISSING_GAS_TYPE': 'Gas type could not be determined from the image.',
    'UNSUPPORTED_GAS_TYPE': 'This gas type is not supported by the system.',
    'INVALID_CAPACITY': 'The cylinder capacity value is invalid.',
    'CAPACITY_OUT_OF_RANGE': 'The cylinder capacity is outside the expected range for this gas type.',

    // Confidence errors
    'LOW_CONFIDENCE_DATE': 'Low confidence in date extraction. Please verify manually.',
    'LOW_CONFIDENCE_NUMBER': 'Low confidence in cylinder number extraction. Please verify manually.',
    'LOW_CONFIDENCE_OVERALL': 'Overall extraction confidence is low. Please retake the image.',

    // Image quality errors
    'IMAGE_TOO_DARK': 'Image is too dark. Please capture in better lighting.',
    'IMAGE_TOO_BLURRY': 'Image is blurry. Please keep the camera steady.',
    'IMAGE_TOO_SMALL': 'Image resolution is too low. Please use a higher resolution.',
    'IMAGE_FORMAT_UNSUPPORTED': 'Image format is not supported. Please use JPEG or PNG.',
    'IMAGE_FILE_TOO_LARGE': 'Image file is too large. Please compress or resize.',

    // System errors
    'OCR_FAILED': 'Text recognition failed. Please try again with a clearer image.',
    'NETWORK_ERROR': 'Network error occurred. Please check your connection.',
    'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
};

/**
 * Map error to user-friendly message
 * @param {string|object} error - Error code or error object
 * @returns {string} User-friendly error message
 */
export const handleValidationError = (error) => {
    if (!error) {
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    // If error is already a string message
    if (typeof error === 'string') {
        return ERROR_MESSAGES[error] || error;
    }

    // If error is an object with code property
    if (typeof error === 'object') {
        const code = error.code || error.message || 'UNKNOWN_ERROR';
        return ERROR_MESSAGES[code] || error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Validate image quality metrics
 * @param {object} imageData - Image data containing quality metrics
 * @returns {object} Validation result with isValid, errors, and warnings
 */
export const validateImageQuality = (imageData) => {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
    };

    // Check if imageData exists
    if (!imageData) {
        result.isValid = false;
        result.errors.push({
            field: 'imageData',
            message: 'No image data provided',
            code: 'MISSING_IMAGE_DATA',
        });
        return result;
    }

    // Check brightness (0-255)
    if (imageData.brightness !== undefined) {
        if (imageData.brightness < 30) {
            result.errors.push({
                field: 'brightness',
                message: 'Image is too dark',
                code: 'IMAGE_TOO_DARK',
            });
            result.isValid = false;
        } else if (imageData.brightness < 60) {
            result.warnings.push('Image may be slightly dark');
        }
    }

    // Check blur/sharpness
    if (imageData.blurScore !== undefined) {
        const minBlurScore = 50;
        if (imageData.blurScore < minBlurScore / 2) {
            result.errors.push({
                field: 'blurScore',
                message: 'Image is too blurry',
                code: 'IMAGE_TOO_BLURRY',
            });
            result.isValid = false;
        } else if (imageData.blurScore < minBlurScore) {
            result.warnings.push('Image may be slightly blurry');
        }
    }

    // Check resolution
    if (imageData.width && imageData.height) {
        const minWidth = IMAGE_VALIDATION_CONFIG.minResolution.width;
        const minHeight = IMAGE_VALIDATION_CONFIG.minResolution.height;

        if (imageData.width < minWidth || imageData.height < minHeight) {
            result.errors.push({
                field: 'resolution',
                message: `Image resolution (${imageData.width}x${imageData.height}) is below minimum (${minWidth}x${minHeight})`,
                code: 'IMAGE_TOO_SMALL',
            });
            result.isValid = false;
        } else if (imageData.width < 1024 || imageData.height < 768) {
            result.warnings.push('Image resolution could be higher for better accuracy');
        }
    }

    // Check file size
    if (imageData.fileSize) {
        const maxSize = IMAGE_VALIDATION_CONFIG.maxFileSize;
        if (imageData.fileSize > maxSize) {
            result.errors.push({
                field: 'fileSize',
                message: `File size (${(imageData.fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum (${maxSize / 1024 / 1024}MB)`,
                code: 'IMAGE_FILE_TOO_LARGE',
            });
            result.isValid = false;
        }
    }

    // Check format
    if (imageData.format) {
        const acceptedFormats = IMAGE_VALIDATION_CONFIG.acceptedFormats;
        const normalizedFormat = imageData.format.toLowerCase().replace('.', '');
        if (!acceptedFormats.includes(normalizedFormat)) {
            result.errors.push({
                field: 'format',
                message: `Format ${imageData.format} is not supported. Accepted: ${acceptedFormats.join(', ')}`,
                code: 'IMAGE_FORMAT_UNSUPPORTED',
            });
            result.isValid = false;
        }
    }

    // Check contrast
    if (imageData.contrast !== undefined) {
        if (imageData.contrast < 20) {
            result.warnings.push('Image has low contrast');
        }
    }

    return result;
};

/**
 * Validate extraction confidence levels
 * @param {object} confidence - Confidence values for different fields
 * @param {object} thresholds - Custom thresholds (optional)
 * @returns {object} Validation result with isValid, errors, and warnings
 */
export const validateExtractionConfidence = (confidence, thresholds = {}) => {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
    };

    const critical = thresholds.critical || CONFIDENCE_THRESHOLDS.critical;
    const warning = thresholds.warning || CONFIDENCE_THRESHOLDS.warning;
    const minimum = thresholds.minimum || CONFIDENCE_THRESHOLDS.minimum;

    // Check overall confidence
    if (confidence.overall !== undefined) {
        if (confidence.overall < minimum) {
            result.errors.push({
                field: 'overall',
                message: 'Overall extraction confidence is too low',
                code: 'LOW_CONFIDENCE_OVERALL',
            });
            result.isValid = false;
        } else if (confidence.overall < warning) {
            result.warnings.push('Overall extraction confidence is low');
        }
    }

    // Check nextTestDate confidence
    if (confidence.nextTestDate !== undefined) {
        const dateThreshold = critical.nextTestDate || CONFIDENCE_THRESHOLDS.critical.nextTestDate;
        if (confidence.nextTestDate < minimum) {
            result.errors.push({
                field: 'nextTestDate',
                message: 'Low confidence in test date extraction',
                code: 'LOW_CONFIDENCE_DATE',
            });
            result.isValid = false;
        } else if (confidence.nextTestDate < dateThreshold) {
            result.warnings.push('Test date extraction confidence could be higher');
        }
    }

    // Check cylinderNumber confidence
    if (confidence.cylinderNumber !== undefined) {
        const numberThreshold = critical.cylinderNumber || CONFIDENCE_THRESHOLDS.critical.cylinderNumber;
        if (confidence.cylinderNumber < minimum) {
            result.errors.push({
                field: 'cylinderNumber',
                message: 'Low confidence in cylinder number extraction',
                code: 'LOW_CONFIDENCE_NUMBER',
            });
            result.isValid = false;
        } else if (confidence.cylinderNumber < numberThreshold) {
            result.warnings.push('Cylinder number extraction confidence could be higher');
        }
    }

    // Check manufacturer confidence
    if (confidence.manufacturer !== undefined && confidence.manufacturer < minimum) {
        result.warnings.push('Manufacturer extraction confidence is low');
    }

    // Check gasType confidence
    if (confidence.gasType !== undefined && confidence.gasType < minimum) {
        result.warnings.push('Gas type extraction confidence is low');
    }

    return result;
};

// ============================================================================
// COMBINED VALIDATION
// ============================================================================

/**
 * Perform complete validation on extracted cylinder data
 * @param {object} extractedData - Data extracted from OCR
 * @param {object} options - Validation options
 * @returns {ValidationResult} Complete validation result
 */
export const validateCylinder = (extractedData, options = {}) => {
    const {
        regionCode = DEFAULT_REGION,
        skipImageQuality = false,
        skipConfidence = false,
        customThresholds = {},
    } = options;

    const result = {
        isValid: false,
        status: STATUS_CODES.UNKNOWN.code,
        daysUntilTest: null,
        daysOverdue: null,
        recommendedAction: '',
        priority: 'low',
        remarks: '',
        errors: [],
        warnings: [],
    };

    // Validate cylinder number
    const cylinderNumberError = validateCylinderNumber(extractedData.cylinderNumber);
    if (cylinderNumberError) {
        result.errors.push(cylinderNumberError);
    }

    // Validate manufacturer code
    const manufacturerError = validateManufacturerCode(extractedData.manufacturerCode);
    if (manufacturerError) {
        result.warnings.push(manufacturerError);
    }

    // Validate gas type
    const gasTypeError = validateGasType(extractedData.gasType);
    if (gasTypeError) {
        result.errors.push(gasTypeError);
    }

    // Validate capacity
    const capacityError = validateCapacity(extractedData.capacity, extractedData.gasType);
    if (capacityError) {
        result.errors.push(capacityError);
    }

    // Validate confidence if provided
    if (!skipConfidence && extractedData.confidence) {
        const confidenceResult = validateExtractionConfidence(
            extractedData.confidence,
            customThresholds
        );
        result.errors.push(...confidenceResult.errors);
        result.warnings.push(...confidenceResult.warnings);
    }

    // Validate image quality if provided
    if (!skipImageQuality && extractedData.imageData) {
        const imageResult = validateImageQuality(extractedData.imageData);
        result.errors.push(...imageResult.errors);
        result.warnings.push(...imageResult.warnings);
    }

    // Evaluate status if we have test date
    if (extractedData.nextTestDate) {
        const statusResult = evaluateCylinderStatus(extractedData, regionCode);
        result.status = statusResult.status;
        result.daysUntilTest = statusResult.daysUntilTest;
        result.daysOverdue = statusResult.daysOverdue;
        result.remarks = statusResult.remarks;
        result.recommendedAction = statusResult.recommendedAction;

        // Add status-related warnings
        result.warnings.push(...statusResult.warnings);

        // Update priority based on status
        if (statusResult.priority === 'critical') {
            result.priority = 'critical';
        } else if (statusResult.priority === 'high' && result.priority !== 'critical') {
            result.priority = 'high';
        } else if (statusResult.priority === 'medium' &&
            result.priority !== 'critical' &&
            result.priority !== 'high') {
            result.priority = 'medium';
        }
    }

    // Determine overall validity
    const hasCriticalErrors = result.errors.length > 0;
    const statusIsValid = result.status === STATUS_CODES.VALID.code ||
        result.status === STATUS_CODES.DUE_SOON.code;

    result.isValid = !hasCriticalErrors && statusIsValid;

    // If there are errors but status is valid, adjust validity
    if (hasCriticalErrors && statusIsValid) {
        result.isValid = false;
    }

    return result;
};

// ============================================================================
// EXPORTS
// ============================================================================

// Export constants for external use
export {
    REGIONAL_CONFIGS,
    STATUS_CODES,
    CONFIDENCE_THRESHOLDS,
    IMAGE_VALIDATION_CONFIG,
    DEFAULT_REGION,
    MANUFACTURER_CODES,
    SUPPORTED_GAS_TYPES,
    CAPACITY_RANGES,
};

// Default export
const cylinderValidator = {
    // Date parsing
    parseDate,
    formatDate,
    calculateDaysDifference,

    // Status determination
    determineStatus,
    evaluateCylinderStatus,

    // Validation rules
    validateCylinderNumber,
    validateManufacturerCode,
    validateGasType,
    validateCapacity,
    getManufacturerName,

    // Error handling
    handleValidationError,
    validateImageQuality,
    validateExtractionConfidence,

    // Combined validation
    validateCylinder,

    // Constants
    REGIONAL_CONFIGS,
    STATUS_CODES,
    CONFIDENCE_THRESHOLDS,
    IMAGE_VALIDATION_CONFIG,
    DEFAULT_REGION,
};

export default cylinderValidator;
