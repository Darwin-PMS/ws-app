/**
 * Cylinder Service
 * 
 * API integration service for Groq Vision OCR with gas cylinder data extraction,
 * validation, and compliance assessment.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { analyzeImage } from './groqApi';
import {
    parseDate,
    formatDate,
    evaluateCylinderStatus,
    validateCylinder,
    validateCylinderNumber,
    validateGasType,
    validateCapacity,
    handleValidationError,
    validateImageQuality,
    validateExtractionConfidence,
} from '../utils/cylinderValidator';
import {
    REGIONAL_CONFIGS,
    STATUS_CODES,
    SAFETY_MESSAGES,
    CONFIDENCE_THRESHOLDS,
    IMAGE_VALIDATION_CONFIG,
    DEFAULT_REGION,
} from '../constants/cylinderStandards';

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Build region-specific OCR prompt for cylinder data extraction
 * @param {string} region - Region code (IN, US, EU, AS)
 * @returns {string} Detailed prompt for OCR
 */
export const buildCylinderPrompt = (region = DEFAULT_REGION) => {
    const regionConfig = REGIONAL_CONFIGS[region] || REGIONAL_CONFIGS[DEFAULT_REGION];

    const prompt = `You are an expert at reading and extracting information from gas cylinder markings and labels.
Analyze the provided image of a gas cylinder and extract ALL of the following information accurately:

## Required Fields (extract exactly as shown on the cylinder):

1. **Cylinder Number** - The unique identification number stamped on the cylinder (e.g., "IN/2019/12345" or "TG-7892")
2. **Serial Number** - Manufacturing serial number (usually a long numeric/alphanumeric code)
3. **Manufacturer** - Manufacturing company name or code (e.g., "BPCL", "IOCL", "HPCL", "Luxfer", "Worthington")
4. **Gas Type** - Type of gas in cylinder (e.g., "LPG", "OXYGEN", "NITROGEN", "CO2", "CNG", "ARGON", "Medical Oxygen", "Fire Extinguisher")
5. **Capacity** - Weight/volume capacity (e.g., "14.2 kg", "7.5 m³", "19 kg")
6. **Manufacture Date** - Date when cylinder was manufactured (format: ${regionConfig.dateFormat})
7. **Test Date** - Date when cylinder was last tested (format: ${regionConfig.dateFormat})
8. **Next Test Date** - Date when cylinder needs to be retested (format: ${regionConfig.dateFormat})
9. **Tare Weight** - Empty weight of cylinder (e.g., "12.5 kg")
10. **Inspection Mark** - Any stamps or marks indicating inspection status

## Output Format:
Return ONLY a valid JSON object with these exact field names (no extra text):
{
  "cylinderNumber": "extracted value or null",
  "serialNumber": "extracted value or null",
  "manufacturer": "extracted value or null",
  "gasType": "extracted value or null",
  "capacity": "extracted value or null",
  "manufactureDate": "extracted value or null",
  "testDate": "extracted value or null",
  "nextTestDate": "extracted value or null",
  "tareWeight": "extracted value or null",
  "inspectionMark": "extracted value or null",
  "remarks": "any additional observations or unclear readings",
  "confidence": {
    "cylinderNumber": 0.0-1.0,
    "serialNumber": 0.0-1.0,
    "manufacturer": 0.0-1.0,
    "gasType": 0.0-1.0,
    "capacity": 0.0-1.0,
    "manufactureDate": 0.0-1.0,
    "testDate": 0.0-1.0,
    "nextTestDate": 0.0-1.0,
    "tareWeight": 0.0-1.0,
    "inspectionMark": 0.0-1.0,
    "overall": 0.0-1.0
  }
}

IMPORTANT: 
- Return ONLY valid JSON, no explanatory text
- If a field cannot be read, use null and set confidence to 0.0
- Date formats to look for: DD/MM/YYYY, MM/DD/YYYY, MM/YY, MMM YYYY, YYYY-MM-DD
- Look carefully at all stamped/marked areas on the cylinder
- Gas types to consider: LPG, PROPANE, BUTANE, OXYGEN, MEDICAL OXYGEN, NITROGEN, ARGON, CO2, CARBON DIOXIDE, HELIUM, HYDROGEN, ACETYLENE, CNG, NATURAL GAS, FIRE EXTINGUISHER`;

    return prompt;
};

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Parse and validate JSON response from Groq Vision
 * @param {string} responseText - Raw response text from API
 * @returns {object} Parsed data with extraction results
 */
export const parseCylinderResponse = (responseText) => {
    const result = {
        data: null,
        confidence: {},
        errors: [],
        warnings: [],
    };

    if (!responseText || typeof responseText !== 'string') {
        result.errors.push({
            code: 'PARSE_ERROR',
            message: 'Empty or invalid response from OCR API',
        });
        return result;
    }

    try {
        // Try to extract JSON from response (in case there's extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            result.errors.push({
                code: 'PARSE_ERROR',
                message: 'No valid JSON found in response',
            });
            return result;
        }

        // Parse the JSON
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and normalize the parsed data
        result.data = {
            cylinderNumber: parsed.cylinderNumber || null,
            serialNumber: parsed.serialNumber || null,
            manufacturer: parsed.manufacturer || null,
            gasType: parsed.gasType || null,
            capacity: parsed.capacity || null,
            manufactureDate: parsed.manufactureDate || null,
            testDate: parsed.testDate || null,
            nextTestDate: parsed.nextTestDate || null,
            tareWeight: parsed.tareWeight || null,
            inspectionMark: parsed.inspectionMark || null,
            remarks: parsed.remarks || '',
        };

        // Extract confidence scores
        if (parsed.confidence && typeof parsed.confidence === 'object') {
            result.confidence = {
                cylinderNumber: parsed.confidence.cylinderNumber ?? 0.0,
                serialNumber: parsed.confidence.serialNumber ?? 0.0,
                manufacturer: parsed.confidence.manufacturer ?? 0.0,
                gasType: parsed.confidence.gasType ?? 0.0,
                capacity: parsed.confidence.capacity ?? 0.0,
                manufactureDate: parsed.confidence.manufactureDate ?? 0.0,
                testDate: parsed.confidence.testDate ?? 0.0,
                nextTestDate: parsed.confidence.nextTestDate ?? 0.0,
                tareWeight: parsed.confidence.tareWeight ?? 0.0,
                inspectionMark: parsed.confidence.inspectionMark ?? 0.0,
                overall: parsed.confidence.overall ?? 0.0,
            };
        } else {
            // If no confidence provided, set default values
            result.confidence = {
                cylinderNumber: 0.5,
                serialNumber: 0.5,
                manufacturer: 0.5,
                gasType: 0.5,
                capacity: 0.5,
                manufactureDate: 0.5,
                testDate: 0.5,
                nextTestDate: 0.5,
                tareWeight: 0.5,
                inspectionMark: 0.5,
                overall: 0.5,
            };
            result.warnings.push({
                code: 'NO_CONFIDENCE_PROVIDED',
                message: 'No confidence scores provided by OCR, using defaults',
            });
        }

        // Add warnings for low confidence fields
        Object.entries(result.confidence).forEach(([field, value]) => {
            if (field !== 'overall' && value < CONFIDENCE_THRESHOLDS.minimum) {
                result.warnings.push({
                    code: 'LOW_CONFIDENCE',
                    message: `Low confidence (${value}) for field: ${field}`,
                });
            }
        });

    } catch (parseError) {
        result.errors.push({
            code: 'JSON_PARSE_ERROR',
            message: `Failed to parse JSON response: ${parseError.message}`,
        });
    }

    return result;
};

// ============================================================================
// COMPLIANCE GENERATION
// ============================================================================

/**
 * Generate compliance details based on extracted data and region
 * @param {object} extractedData - Extracted cylinder data
 * @param {object} regionConfig - Regional configuration
 * @returns {object} Compliance information
 */
export const generateComplianceInfo = (extractedData, regionConfig) => {
    const compliance = {
        region: regionConfig.code,
        standard: '',
        testInterval: null,
        maxAge: null,
        isCompliant: false,
        retestProvider: '',
        contactInfo: '',
        emergencyContact: '',
    };

    // Determine standard based on region
    switch (regionConfig.code) {
        case 'IN':
            compliance.standard = 'PESO (IS 3196, IS 7285)';
            break;
        case 'US':
            compliance.standard = 'DOT (49 CFR)';
            break;
        case 'EU':
            compliance.standard = 'TPED (2010/35/EU)';
            break;
        case 'AS':
            compliance.standard = 'AS/NZS 1841';
            break;
        default:
            compliance.standard = 'International';
    }

    // Determine test interval based on gas type
    const gasType = (extractedData.gasType || '').toUpperCase();
    let testIntervalKey = 'industrial';

    if (gasType.includes('LPG') && gasType.includes('DOMESTIC')) {
        testIntervalKey = 'lpgDomestic';
    } else if (gasType.includes('LPG')) {
        testIntervalKey = 'lpgCommercial';
    } else if (gasType.includes('OXYGEN') && gasType.includes('MEDICAL')) {
        testIntervalKey = 'medicalOxygen';
    } else if (gasType.includes('CNG') || gasType.includes('NATURAL')) {
        testIntervalKey = 'cng';
    } else if (gasType.includes('FIRE') || gasType.includes('EXTINGUISHER')) {
        testIntervalKey = 'fireExtinguisher';
    }

    const interval = regionConfig.testIntervals[testIntervalKey];
    if (interval) {
        compliance.testInterval = `${interval.years} years`;
    }

    // Get max age
    if (gasType.includes('LPG')) {
        compliance.maxAge = regionConfig.maxAge.lpg ? `${regionConfig.maxAge.lpg.years} years` : null;
    } else if (gasType.includes('CNG')) {
        compliance.maxAge = regionConfig.maxAge.cng ? `${regionConfig.maxAge.cng.years} years` : null;
    } else if (gasType.includes('FIRE') || gasType.includes('EXTINGUISHER')) {
        compliance.maxAge = regionConfig.maxAge.fireExtinguisher ? `${regionConfig.maxAge.fireExtinguisher.years} years` : null;
    } else {
        compliance.maxAge = regionConfig.maxAge.industrial ? `${regionConfig.maxAge.industrial.years} years` : null;
    }

    // Check compliance based on status
    const statusResult = evaluateCylinderStatus(extractedData, regionConfig.code);
    compliance.isCompliant = statusResult.status === STATUS_CODES.VALID.code ||
        statusResult.status === STATUS_CODES.DUE_SOON.code;

    // Set contact information
    compliance.retestProvider = regionConfig.retestProviderUrl;
    compliance.contactInfo = regionConfig.retestProviderUrl;
    compliance.emergencyContact = regionConfig.emergencyContact;

    return compliance;
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Analyze cylinder image using Groq Vision API for OCR
 * @param {string} apiKey - Groq API key
 * @param {string} base64Image - Base64 encoded image
 * @param {string} region - Region code (IN, US, EU, AS)
 * @returns {Promise<object>} OCR extraction result
 */
export const analyzeCylinderImage = async (apiKey, base64Image, region = DEFAULT_REGION) => {
    const startTime = Date.now();

    try {
        const prompt = buildCylinderPrompt(region);

        const responseText = await analyzeImage(
            apiKey,
            base64Image,
            prompt,
            'meta-llama/llama-4-scout-17b-16e-instruct'
        );

        const parseResult = parseCylinderResponse(responseText);

        return {
            success: true,
            data: parseResult.data,
            confidence: parseResult.confidence,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
            metadata: {
                processedAt: new Date().toISOString(),
                ocrEngine: 'groq-vision-llama-4-scout',
                processingTimeMs: Date.now() - startTime,
                region: region,
            },
        };

    } catch (error) {
        // Handle different error types
        const errorResult = {
            success: false,
            data: null,
            confidence: {},
            errors: [],
            warnings: [],
            metadata: {
                processedAt: new Date().toISOString(),
                ocrEngine: 'groq-vision-llama-4-scout',
                processingTimeMs: Date.now() - startTime,
                region: region,
            },
        };

        if (error.message && error.message.includes('API Error')) {
            const statusMatch = error.message.match(/API Error: (\d+)/);
            const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500;

            if (statusCode === 429) {
                errorResult.errors.push({
                    code: 'RATE_LIMIT_ERROR',
                    message: 'API rate limit exceeded. Please try again later.',
                });
            } else if (statusCode === 401) {
                errorResult.errors.push({
                    code: 'AUTH_ERROR',
                    message: 'Invalid API key. Please check your credentials.',
                });
            } else if (statusCode >= 500) {
                errorResult.errors.push({
                    code: 'SERVER_ERROR',
                    message: 'OCR service is temporarily unavailable.',
                });
            } else {
                errorResult.errors.push({
                    code: 'API_ERROR',
                    message: error.message,
                });
            }
        } else if (error.message && error.message.includes('network')) {
            errorResult.errors.push({
                code: 'NETWORK_ERROR',
                message: 'Network error. Please check your internet connection.',
            });
        } else if (error.message && error.message.includes('image')) {
            errorResult.errors.push({
                code: 'IMAGE_ERROR',
                message: 'Error processing image. Please try with a different image.',
            });
        } else {
            errorResult.errors.push({
                code: 'OCR_FAILED',
                message: error.message || 'Failed to analyze cylinder image',
            });
        }

        return errorResult;
    }
};

/**
 * Validate extracted cylinder data using cylinderValidator
 * @param {object} extractedData - Data extracted from OCR
 * @param {string} region - Region code (IN, US, EU, AS)
 * @returns {object} Validation result
 */
export const validateCylinderData = (extractedData, region = DEFAULT_REGION) => {
    const validationResult = validateCylinder(extractedData, {
        regionCode: region,
        skipImageQuality: true,
        skipConfidence: false,
    });

    // Add additional validation details
    const validatedData = {
        ...extractedData,
        confidence: extractedData.confidence || {},
    };

    // Run individual field validations
    const fieldValidations = {
        cylinderNumber: validateCylinderNumber(extractedData.cylinderNumber),
        gasType: validateGasType(extractedData.gasType),
        capacity: validateCapacity(extractedData.capacity, extractedData.gasType),
    };

    // Add field validation errors to result
    Object.entries(fieldValidations).forEach(([field, error]) => {
        if (error) {
            validationResult.errors.push(error);
        }
    });

    return validationResult;
};

/**
 * Get status assessment for validated cylinder data
 * @param {object} validatedData - Validated cylinder data
 * @returns {object} Status assessment result
 */
export const getStatusAssessment = (validatedData) => {
    const regionConfig = REGIONAL_CONFIGS[DEFAULT_REGION];

    // Get status from validated data
    const statusResult = evaluateCylinderStatus(validatedData, DEFAULT_REGION);

    // Get safety message
    const safetyMessage = SAFETY_MESSAGES[statusResult.status] || SAFETY_MESSAGES[STATUS_CODES.UNKNOWN.code];

    // Determine recommended action
    let recommendedAction = statusResult.recommendedAction;
    let priority = statusResult.priority;

    // Adjust based on validation errors
    if (validatedData.errors && validatedData.errors.length > 0) {
        const hasCriticalError = validatedData.errors.some(err =>
            err.code && (err.code.includes('MISSING') || err.code.includes('INVALID'))
        );
        if (hasCriticalError) {
            priority = 'critical';
            recommendedAction = 'Manual verification required - critical data missing or invalid';
        }
    }

    return {
        status: {
            code: statusResult.status,
            label: STATUS_CODES[statusResult.status]?.name || 'Unknown',
            color: STATUS_CODES[statusResult.status]?.color || '#6B7280',
            daysUntilTest: statusResult.daysUntilTest,
            daysOverdue: statusResult.daysOverdue,
        },
        assessment: {
            recommendedAction: recommendedAction,
            priority: priority,
            remarks: statusResult.remarks,
            safetyTitle: safetyMessage.title,
            safetyMessage: safetyMessage.message,
        },
    };
};

/**
 * Process cylinder image through complete pipeline: analyze + validate + assess
 * @param {string} apiKey - Groq API key
 * @param {string} base64Image - Base64 encoded image
 * @param {string} region - Region code (IN, US, EU, AS)
 * @returns {Promise<object>} Complete processing result
 */
export const processCylinderImage = async (apiKey, base64Image, region = DEFAULT_REGION) => {
    const startTime = Date.now();
    const regionConfig = REGIONAL_CONFIGS[region] || REGIONAL_CONFIGS[DEFAULT_REGION];

    // Step 1: Analyze image with OCR
    const analysisResult = await analyzeCylinderImage(apiKey, base64Image, region);

    if (!analysisResult.success || !analysisResult.data) {
        // Return early if analysis failed
        return {
            extraction: null,
            confidence: {},
            status: {
                code: STATUS_CODES.UNKNOWN.code,
                label: 'Analysis Failed',
                color: STATUS_CODES.UNKNOWN.color,
                daysUntilTest: null,
                daysOverdue: null,
            },
            assessment: {
                recommendedAction: 'Please try again with a clearer image',
                priority: 'high',
                remarks: analysisResult.errors[0]?.message || 'OCR analysis failed',
            },
            compliance: {
                region: region,
                standard: 'PESO (IS 3196, IS 7285)', // Default, will be updated in final result
                testInterval: null,
                isCompliant: false,
                retestProvider: regionConfig.retestProviderUrl,
                contactInfo: regionConfig.retestProviderUrl,
                emergencyContact: regionConfig.emergencyContact,
            },
            metadata: {
                processedAt: new Date().toISOString(),
                imageQuality: 'unknown',
                ocrEngine: 'groq-vision-llama-4-scout',
                processingTimeMs: Date.now() - startTime,
            },
            errors: analysisResult.errors,
            warnings: analysisResult.warnings,
        };
    }

    // Step 2: Validate extracted data
    const validationResult = validateCylinderData(analysisResult.data, region);

    // Step 3: Get status assessment
    const assessmentResult = getStatusAssessment({
        ...analysisResult.data,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
    });

    // Step 4: Generate compliance info
    const complianceInfo = generateComplianceInfo(analysisResult.data, regionConfig);

    // Build final result
    const finalResult = {
        extraction: analysisResult.data,
        confidence: analysisResult.confidence,
        status: assessmentResult.status,
        assessment: assessmentResult.assessment,
        compliance: complianceInfo,
        contact: {
            retestProvider: regionConfig.retestProviderUrl,
            contactInfo: regionConfig.retestProviderUrl,
            emergencyContact: regionConfig.emergencyContact,
        },
        metadata: {
            processedAt: new Date().toISOString(),
            imageQuality: 'good', // Could be enhanced with image quality detection
            ocrEngine: 'groq-vision-llama-4-scout',
            processingTimeMs: Date.now() - startTime,
        },
        errors: [],
        warnings: [],
    };

    // Add validation errors
    if (validationResult.errors && validationResult.errors.length > 0) {
        finalResult.errors = validationResult.errors.map(err => ({
            field: err.field,
            message: err.message,
            code: err.code,
        }));
    }

    // Add warnings from both analysis and validation
    const allWarnings = [
        ...(analysisResult.warnings || []),
        ...(validationResult.warnings || []),
    ];

    // Deduplicate warnings
    const uniqueWarnings = [];
    const seenCodes = new Set();
    allWarnings.forEach(warning => {
        const code = warning.code || warning.message;
        if (!seenCodes.has(code)) {
            seenCodes.add(code);
            uniqueWarnings.push(warning);
        }
    });

    finalResult.warnings = uniqueWarnings;

    return finalResult;
};

// ============================================================================
// ADDITIONAL HELPER FUNCTIONS
// ============================================================================

/**
 * Get default region configuration
 * @returns {string} Default region code
 */
export const getDefaultRegion = () => DEFAULT_REGION;

/**
 * Get all available regions
 * @returns {Array} List of available region codes
 */
export const getAvailableRegions = () => Object.keys(REGIONAL_CONFIGS);

/**
 * Get region configuration
 * @param {string} region - Region code
 * @returns {object} Region configuration
 */
export const getRegionConfig = (region) => {
    return REGIONAL_CONFIGS[region] || REGIONAL_CONFIGS[DEFAULT_REGION];
};

/**
 * Check if cylinder is compliant based on status
 * @param {string} statusCode - Status code
 * @returns {boolean} Whether cylinder is compliant
 */
export const isCylinderCompliant = (statusCode) => {
    return statusCode === STATUS_CODES.VALID.code ||
        statusCode === STATUS_CODES.DUE_SOON.code;
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Cylinder Service - Complete API for Groq Vision OCR integration
 */
const cylinderService = {
    // Prompt building
    buildCylinderPrompt,

    // Response parsing
    parseCylinderResponse,

    // Compliance generation
    generateComplianceInfo,

    // Main API functions
    analyzeCylinderImage,
    validateCylinderData,
    getStatusAssessment,
    processCylinderImage,

    // Helper functions
    getDefaultRegion,
    getAvailableRegions,
    getRegionConfig,
    isCylinderCompliant,

    // Re-exported utilities
    parseDate,
    formatDate,
    evaluateCylinderStatus,
    validateCylinder,
    handleValidationError,
};

export default cylinderService;
