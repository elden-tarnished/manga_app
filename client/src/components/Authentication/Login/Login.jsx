import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import sharedStyles from '../AuthShared.module.css';
import styles from './Login.module.css';
import axios from 'axios';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import SplitText from 'gsap/SplitText';
import { useAuth } from '../../../Context/AuthContext.jsx';
import { useAppError } from '../../../Context/AppErrorContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const page = useRef(null)
  const errorRef = useRef(null)
  const { login } = useAuth();
  const { setGlobalError } = useAppError();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  useGSAP(() => {
    if (!errorRef.current || !error) return
    const chars = SplitText.create(errorRef.current, { type: 'chars' }).chars
    gsap.from(chars, {
      opacity: 0,
      scale: 0,
      stagger: 0.01,
      duration: 0.2
    })
  }, { dependencies: [error] })

  async function loginUser(e) {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/user/login`,
        { username: identifier, password },
        { withCredentials: true },
      );

      login(res.data.user); // Update global user state
      navigate('/');
    } catch (err) {
      const message = err?.response?.data?.error || 'Login failed';
      setError(message);
      console.error('Login failed:', err);
      setGlobalError(message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className={sharedStyles.page} ref={page}>
      <section className={`${sharedStyles.card} ${styles.card}`} aria-label="Login">
        <header className={sharedStyles.header}>
          <h1 className={sharedStyles.title}>Welcome back</h1>
          <p className={sharedStyles.subtitle}>Sign in to continue</p>
        </header>

        <form className={sharedStyles.form} onSubmit={loginUser}>
          <label className={sharedStyles.label}>
            <span className={sharedStyles.labelText}>Email or username</span>
            <input
              className={sharedStyles.input}
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Username or Email"
              onChange={(e) => setIdentifier(e.target.value)}
              value={identifier}
            />
          </label>

          <label className={sharedStyles.label}>
            <span className={sharedStyles.labelText}>Password</span>
            <input
              className={sharedStyles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your Password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
          </label>

          <p className={sharedStyles.error} ref={errorRef}>{error}</p>

          <button className={sharedStyles.primaryButton} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className={`${sharedStyles.metaRow} ${styles.metaRow}`}>
            <Link to="/signup" className={sharedStyles.linkButton}>
              Create account
            </Link>
            <button className={sharedStyles.linkButton} type="button">
              Forgot password?
            </button>
          </div>
          <Link to="/" className={sharedStyles.linkButton}>
            ← Back to manga
          </Link>
        </form>
      </section>
    </main>
  );
}
