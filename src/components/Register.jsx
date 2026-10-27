import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordField from './PasswordField.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const session = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      saveSession(session);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark"><img src="img/documind-ai.png" alt="" /></div>
        <p className="eyebrow">YOUR PRIVATE KNOWLEDGE ASSISTANT</p>
        <h1>Create your account</h1>
        <p className="muted">Ask questions about your documents. Get answers with sources.</p>
        <form onSubmit={handleSubmit} className="stack">
          <label>Name<input value={name} onChange={event => setName(event.target.value)} required minLength="2" maxLength="80" /></label>
          <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></label>
          <PasswordField value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" />
          {error && <p className="error">{error}</p>}
          <button disabled={busy}>{busy ? 'Please wait…' : 'Create account'}</button>
        </form>
        <p className="switch">Already have an account? <Link className="text-button" to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
