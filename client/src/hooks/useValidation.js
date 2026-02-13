import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAppError } from '../Context/AppErrorContext.jsx';

const API_URL = import.meta.env.VITE_API_URL;


/**
 * Custom hook for password validation with backend API
 * Used by both Signup and ChangeInfo components
 */
export function usePasswordValidation() {
    const { setGlobalError } = useAppError();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [matchError, setMatchError] = useState('');
    const debounceRef = useRef(null);

    const validatePassword = useCallback(async (value) => {
        setPassword(value);
        setErrors([]);
        setMatchError('');

        if (!value) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            try {
                const { data } = await axios.post(
                    `${API_URL}/user/validate-password`,
                    { password: value },
                    { withCredentials: true }
                );
                if (!data.valid) {
                    setErrors(data.errors || []);
                }
            } catch {
                setGlobalError('Password validation is unavailable right now.');
            }
        }, 300);
    }, [setGlobalError]);

    const reset = useCallback(() => {
        setPassword('');
        setConfirmPassword('');
        setErrors([]);
        setMatchError('');
    }, []);

    const isValid = useCallback(() => {
        if (!password) return true; // Empty is valid (optional)
        if (errors.length > 0) return false;
        return password === confirmPassword;

    }, [password, confirmPassword, errors]);

    return {
        password,
        confirmPassword,
        errors,
        matchError,
        validatePassword,
        setConfirmPassword,
        setMatchError,
        reset,
        isValid,
    };
}

/**
 * Custom hook for username validation with backend API
 * Used by both Signup and ChangeInfo components
 * @param {string} currentUsername - The user's current username (for ChangeInfo)
 * @param {boolean} requireAuth - Whether the API requires authentication
 */
export function useUsernameValidation(currentUsername = null, requireAuth = true) {
    const { setGlobalError } = useAppError();
    const [username, setUsername] = useState('');
    const [status, setStatus] = useState('idle'); // idle, checking, available, taken, same, error
    const [error, setError] = useState('');
    const timeoutRef = useRef(null);

    const validate = useCallback(async (value) => {
        setUsername(value);
        setError('');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (!value) {
            setStatus('idle');
            return;
        }

        if (value.length < 3) {
            setStatus('idle');
            setError('Must be at least 3 characters');
            return;
        }

        if (value.length > 28) {
            setStatus('idle');
            setError('Must be 28 characters or less');
            return;
        }

        if (currentUsername && value === currentUsername) {
            setStatus('same');
            return;
        }

        setStatus('checking');

        timeoutRef.current = setTimeout(async () => {
            try {
                // Use check-username for authenticated users, different endpoint for signup
                const endpoint = requireAuth
                    ? `${API_URL}/user/check-username`
                    : `${API_URL}/user/check-username-public`;

                const { data } = await axios.post(
                    endpoint,
                    { username: value },
                    { withCredentials: true }
                );

                if (data.valid && data.available) {
                    setStatus('available');
                    setError('');
                } else if (data.reason === 'same_as_current') {
                    setStatus('same');
                } else {
                    setStatus('taken');
                    setError(data.error || 'Username not available');
                }
            } catch {
                setStatus('error');
                setError('Error checking username');
                setGlobalError('Username validation is unavailable right now.');
            }
        }, 400);
    }, [currentUsername, requireAuth, setGlobalError]);

    const reset = useCallback((initialValue = '') => {
        setUsername(initialValue);
        setStatus(initialValue ? 'same' : 'idle');
        setError('');
    }, []);

    return {
        username,
        status,
        error,
        validate,
        reset,
        setError,
    };
}
