/**
 * Security utilities for Salary Slip verification
 */

/**
 * Generates a SHA-256 hash of a string
 * @param {string} message 
 * @returns {Promise<string>}
 */
export const generateHash = async (message) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

/**
 * Generates a unique ID in UUID format
 * @returns {string}
 */
export const generateUUID = () => {
    return crypto.randomUUID();
};
