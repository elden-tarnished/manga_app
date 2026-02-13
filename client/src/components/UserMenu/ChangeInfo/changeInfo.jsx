import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './changeInfo.module.css';
import { useAuth } from '../../../Context/AuthContext.jsx';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { usePasswordValidation, useUsernameValidation } from '../../../hooks/useValidation.js';
import { useAppError } from '../../../Context/AppErrorContext.jsx';

const API_URL = import.meta.env.VITE_API_URL;


// Reusable Input Component
function FormInput({ label, type = 'text', value, onChange, placeholder, error, statusIcon }) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        <span className={styles.labelText}>{label}</span>
        <div className={styles.inputWrapper}>
          <input
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
          />
          {statusIcon}
        </div>
      </label>
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
}

// Status Icon components
function SpinnerIcon() {
  return (
    <div className={styles.statusIcon}>
      <svg className={styles.spinner} viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="80" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className={`${styles.statusIcon} ${styles.iconSuccess}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className={`${styles.statusIcon} ${styles.iconError}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

export function ChangeInfo({ isOpen, onClose, onBackAnimationComplete }) {
  const { user, login } = useAuth();
  const { setGlobalError } = useAppError();
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  // Use shared validation hooks
  const usernameValidation = useUsernameValidation(user?.username, true);
  const passwordValidation = usePasswordValidation();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Reset form when opened
  useEffect(() => {
    if (isOpen && user) {
      usernameValidation.reset(user.username);
      passwordValidation.reset();
      setMessage({ type: '', text: '' });
    }
  }, [isOpen, user]);

  // Build animation timeline with proper scope and cleanup
  const { contextSafe } = useGSAP(() => {
    if (!containerRef.current) return;

    // Select all animatable elements using scope
    const formWrapper = gsap.utils.toArray('[data-animate="wrapper"]', containerRef.current);
    const elements = gsap.utils.toArray('[data-animate="item"]', containerRef.current);

    if (!formWrapper || elements.length === 0) return;

    // Create timeline with paused state
    timelineRef.current = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.out' },
      onStart: () => {
        // Show container before animation starts
        containerRef.current.style.display = 'grid';
      },
      onReverseComplete: () => {
        // Hide container after reverse animation completes
        containerRef.current.style.display = 'none';
      }
    });

    // Set initial states with fromTo for predictable animation
    timelineRef.current
      .fromTo(formWrapper,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3
        }
      )
      .fromTo(elements,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: {
            each: 0.06,
            ease: 'power1.out'
          }
        },
        0.1 // Start slightly after wrapper fades in
      );

  }, { scope: containerRef });

  // Play animation when isOpen changes to true
  useEffect(() => {
    if (isOpen && timelineRef.current) {
      timelineRef.current.play();
    }
  }, [isOpen]);

  // Handle close with smooth reverse animation - wrapped in contextSafe
  const handleClose = contextSafe(() => {
    if (timelineRef.current) {
      // Store callbacks to call after reverse completes
      timelineRef.current.eventCallback('onReverseComplete', () => {
        // Hide container
        containerRef.current.style.display = 'none';
        // Call original callbacks
        onClose();
        if (onBackAnimationComplete) {
          onBackAnimationComplete();
        }
      });
      // Reverse with slightly faster speed for snappy feel
      timelineRef.current.timeScale(1.3).reverse();
    } else {
      containerRef.current.style.display = 'none';
      onClose();
      if (onBackAnimationComplete) {
        onBackAnimationComplete();
      }
    }
  });

  const getStatusIcon = () => {
    switch (usernameValidation.status) {
      case 'checking': return <SpinnerIcon />;
      case 'available': return <CheckIcon />;
      case 'taken': return <ErrorIcon />;
      default: return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const payload = {};
    const { username, status: usernameStatus } = usernameValidation;
    const { password, confirmPassword, errors: passErrors } = passwordValidation;

    // Validate username change
    if (username !== user?.username) {
      if (usernameStatus !== 'available') {
        usernameValidation.setError('Username not available');
        return;
      }
      payload.username = username;
    }

    // Validate password change
    if (password) {
      if (passErrors.length > 0) {
        passwordValidation.setMatchError('Fix password requirements');
        return;
      }
      if (password !== confirmPassword) {
        passwordValidation.setMatchError("Passwords don't match");
        return;
      }
      payload.password = password;
    }

    if (Object.keys(payload).length === 0) {
      setMessage({ type: 'error', text: 'No changes to save' });
      return;
    }

    setLoading(true);
    try {
      await axios.patch(`${API_URL}/user`, payload, { withCredentials: true });

      if (payload.username) {
        login({ ...user, username: payload.username });
      }

      setMessage({ type: 'success', text: 'Profile updated!' });
      passwordValidation.reset();
      setTimeout(handleClose, 1200);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Update failed';
      setGlobalError(errorMsg);

      if (errorMsg.toLowerCase().includes('password')) {
        passwordValidation.setMatchError(errorMsg);
      } else if (errorMsg.toLowerCase().includes('username')) {
        usernameValidation.setError(errorMsg);
      } else {
        setMessage({ type: 'error', text: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.formWrapper} data-animate="wrapper">
        <button
          className={styles.backButton}
          onClick={handleClose}
          type="button"
          data-animate="item"
        >
          <span className={styles.backArrow}>←</span>
          Back
        </button>

        <header className={styles.header}>
          <h1 className={styles.title} data-animate="item">Update Profile</h1>
          <p className={styles.subtitle} data-animate="item">Change your username or password</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div data-animate="item">
            <FormInput
              label="Username"
              value={usernameValidation.username}
              onChange={(e) => usernameValidation.validate(e.target.value)}
              placeholder="Enter new username"
              error={usernameValidation.error}
              statusIcon={getStatusIcon()}
            />
          </div>

          <div className={styles.divider} data-animate="item" />

          <div data-animate="item">
            <FormInput
              label="New Password"
              type="password"
              value={passwordValidation.password}
              onChange={(e) => passwordValidation.validatePassword(e.target.value)}
              placeholder="Leave empty to keep current"
              error={passwordValidation.errors[0]}
            />
          </div>

          <div data-animate="item" style={{ display: passwordValidation.password ? 'block' : 'none' }}>
            <FormInput
              label="Confirm Password"
              type="password"
              value={passwordValidation.confirmPassword}
              onChange={(e) => passwordValidation.setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              error={passwordValidation.matchError}
            />
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={loading}
            data-animate="item"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {message.text && (
          <div className={`${styles.toast} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
