import { useState } from 'react';
import axios from 'axios';
import sharedStyles from '../AuthShared.module.css';
import styles from './Signup.module.css';

export default function Signup() {
  const URL = 'http://localhost:3000';

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function signupUser(e) {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      // Backend currently expects: { username, password, email }
      const res = await axios.post(
        `${URL}/user/signup`,
        { username, password, email },
        { withCredentials: true },
      );

      console.log('Signup success:', res.data);
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Signup failed';
      setError(message);
      console.error('Signup failed:', err);
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error ? <p className={sharedStyles.error}>{error}</p> : null}

          <button className={sharedStyles.primaryButton} type="submit" disabled={loading}>
            {loading ? 'Signing up…' : 'Sign up'}
          </button>

          <div className={`${sharedStyles.metaRow} ${styles.metaRow}`}>
            <button className={sharedStyles.linkButton} type="button">
              Already have an account?
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
