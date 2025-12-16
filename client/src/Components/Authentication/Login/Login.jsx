import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import sharedStyles from '../AuthShared.module.css';
import styles from './Login.module.css';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const URL = 'http://localhost:3000';

  async function loginUser(e) {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      const res = await axios.post(
        `${URL}/user/login`,
        { username: identifier, password },
        { withCredentials: true },
      );

      console.log('Login successful:', res.data);
      navigate('/');
    } catch (err) {
      const message = err?.response?.data?.error || 'Login failed';
      setError(message);
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className={sharedStyles.page}>
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

          {error ? <p className={sharedStyles.error}>{error}</p> : null}

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
