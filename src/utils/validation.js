/**
 * Shared validation utilities for user input
 */

// Password validation patterns
const PASSWORD_PATTERNS = {
    lowercase: /(?=.*[a-z])/,
    uppercase: /(?=.*[A-Z])/,
    digit: /(?=.*\d)/,
    special: /(?=.*[!@#$%^&*()_+={};"'<>,./])/,
    length: /^.{8,28}$/,
};

// Username validation pattern
const USERNAME_PATTERN = /^.{3,28}$/;

/**
 * Validates a password against all requirements
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
    if (!password) {
        return { valid: false, errors: ['Password is required'] };
    }

    const errors = [];

    if (!PASSWORD_PATTERNS.length.test(password)) {
        errors.push('Must be 8-28 characters');
    }
    if (!PASSWORD_PATTERNS.lowercase.test(password)) {
        errors.push('Must contain a lowercase letter');
    }
    if (!PASSWORD_PATTERNS.uppercase.test(password)) {
        errors.push('Must contain an uppercase letter');
    }
    if (!PASSWORD_PATTERNS.digit.test(password)) {
        errors.push('Must contain a digit');
    }
    if (!PASSWORD_PATTERNS.special.test(password)) {
        errors.push('Must contain a special character (!@#$%^&*...)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validates a username format
 * @param {string} username - The username to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateUsername(username) {
    if (!username) {
        return { valid: false, error: 'Username is required' };
    }

    if (!USERNAME_PATTERN.test(username)) {
        return { valid: false, error: 'Username must be 3-28 characters' };
    }

    return { valid: true, error: null };
}
