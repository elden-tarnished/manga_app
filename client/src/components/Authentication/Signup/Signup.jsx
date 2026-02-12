import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import axios from 'axios';
import sharedStyles from '../AuthShared.module.css';
import styles from './Signup.module.css';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import SplitText from 'gsap/SplitText';
import { usePasswordValidation } from '../../../hooks/useValidation.js';
import { useAppError } from '../../../Context/AppErrorContext.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { setGlobalError } = useAppError();

  const URL = 'http://localhost:3000';
  const errorRef = useRef(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Use shared password validation hook
  const passwordValidation = usePasswordValidation();

  useGSAP(() => {
    if (!errorRef.current || !error) return;
    const chars = SplitText.create(errorRef.current, { type: 'chars' }).chars;
    gsap.from(chars, {
      opacity: 0,
      scale: 0,
      stagger: 0.01,
      duration: 0.2
    });
  }, { dependencies: [error] });

  async function signupUser(e) {
    e.preventDefault();
    setError('');

    // Check password validation before submitting
    if (passwordValidation.errors.length > 0) {
      setError(passwordValidation.errors[0]);
      return;
    }

    if (!passwordValidation.password) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${URL}/user/signup`,
        { username, password: passwordValidation.password, email },
        { withCredentials: true },
      );

      console.log('Signup success:', res.data);
      setUsername('');
      setEmail('');
      passwordValidation.reset();

      navigate('/login');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Signup failed';
      setError(message);
      console.error('Signup failed:', err);
      setGlobalError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={sharedStyles.page}>
      <section className={`${sharedStyles.card} ${styles.card}`} aria-label="Sign up">
        <header className={sharedStyles.header}>
          <h1 className={sharedStyles.title}>Create your account</h1>
          <p className={sharedStyles.subtitle}>Join to track manga and sync progress</p>
        </header>

        <form className={sharedStyles.form} onSubmit={signupUser}>
          <label className={sharedStyles.label}>
            <span className={sharedStyles.labelText}>Username</span>
            <input
              className={sharedStyles.input}
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Your Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className={sharedStyles.label}>
            <span className={sharedStyles.labelText}>Email</span>
            <input
              className={sharedStyles.input}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className={sharedStyles.label}>
            <span className={sharedStyles.labelText}>Password</span>
            <input
              className={sharedStyles.input}
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Your Password"
              value={passwordValidation.password}
              onChange={(e) => passwordValidation.validatePassword(e.target.value)}
            />
          </label>
          {passwordValidation.errors.length > 0 && (
            <p className={sharedStyles.error} style={{ marginTop: '-8px' }}>
              {passwordValidation.errors[0]}
            </p>
          )}

          <p className={sharedStyles.error} ref={errorRef}>{error}</p>

          <button className={sharedStyles.primaryButton} type="submit" disabled={loading}>
            {loading ? 'Signing up…' : 'Sign up'}
          </button>

          <div className={`${sharedStyles.metaRow} ${styles.metaRow}`}>
            <Link to="/login" className={sharedStyles.linkButton}>
              Already have an account?
            </Link>
          </div>

          <Link to="/" className={sharedStyles.linkButton}>
            ← Back to manga
          </Link>
        </form>
      </section>
    </main>
  );
}
