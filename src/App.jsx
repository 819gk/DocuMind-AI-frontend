import { useEffect, useState } from 'react';
import { api } from './api';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('knowly_token') || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('knowly_user') || 'null'); } catch { return null; }
  });
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [documents, setDocuments] = useState([]);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function saveSession(data) {
    setToken(data.token); setUser(data.user);
    localStorage.setItem('knowly_token', data.token);
    localStorage.setItem('knowly_user', JSON.stringify(data.user));
  }
  
  function logout() {
    setToken(''); setUser(null); setDocuments([]); setMessages([]);
    localStorage.removeItem('knowly_token'); localStorage.removeItem('knowly_user');
  }

  async function authenticate(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password };
      saveSession(await api(endpoint, { method: 'POST', body: JSON.stringify(body) }));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function refreshDocuments() {
    const result = await api('/documents', { token });
    setDocuments(result.documents);
  }
  async function refreshHistory() {
    const result = await api('/chat/history', { token });
    setMessages(result.messages.map(m => ({ role: m.role, content: m.content, citations: m.citations || [] })));
  }

  useEffect(() => {
    if (!token) return;
    Promise.all([refreshDocuments(), refreshHistory()]).catch(e => setError(e.message));
  }, [token]);

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(''); setUploading(true);
    const form = new FormData(); form.append('file', file);
    try {
      const result = await api('/documents/upload', { token, method: 'POST', body: form });
      await refreshDocuments();
      setError(result.document?.status === 'ready' ? '' : 'Upload completed, but processing may need checking.');
    } catch (e) {
      setError(e.message);
      await refreshDocuments().catch(() => {});
    } finally { setUploading(false); }
  }

  async function deleteDocument(id) {
    if (!window.confirm('Delete this document and its indexed vectors?')) return;
    setError('');
    try { await api(`/documents/${id}`, { token, method: 'DELETE' }); await refreshDocuments(); }
    catch (e) { setError(e.message); }
  }

  async function ask(event) {
    event.preventDefault();
    const value = question.trim();
    if (!value || busy) return;
    setQuestion(''); setError('');
    setMessages(prev => [...prev, { role: 'user', content: value }]);
    setBusy(true);
    try {
      const result = await api('/chat', { token, method: 'POST', body: JSON.stringify({ question: value }) });
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer, citations: result.citations || [] }]);
    } catch (e) {
      setError(e.message);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I could not complete that request. Please check the error message and try again.' }]);
    } finally { setBusy(false); }
  }

  if (!token) return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark"><img src="img/documind-ai.png" alt="" /></div>
        <p className="eyebrow">YOUR PRIVATE KNOWLEDGE ASSISTANT</p>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">Ask questions about your documents. Get answers with sources.</p>
        <form onSubmit={authenticate} className="stack">
          {mode === 'register' && <label>Name<input value={name} onChange={e => setName(e.target.value)} required minLength="2" maxLength="80" /></label>}
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="10" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {error && <p className="error">{error}</p>}
          <button disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="switch">{mode === 'login' ? 'New to DocuMind?' : 'Already have an account?'} <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
      </section>
    </main>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark small"><div><img src="img/documind-ai.png" alt="" /></div></span><span>DocuMind<span className="brand-ai"> AI</span></span></div>
        <p className="side-label">WORKSPACE</p>
        <div className="side-item active">▤ <span>Knowledge base</span></div>
        <div className="side-item">✧ <span>AI Assistant</span></div>
        <div className="sidebar-bottom"><div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div><div className="user-info"><strong>{user?.name}</strong><small>{user?.email}</small></div><button className="icon-button" onClick={logout} title="Sign out">↪</button></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><p className="eyebrow">WORKSPACE</p><h1>Knowledge assistant</h1></div><span className="status-pill">● AI ready</span></header>
        {error && <div className="notice">{error}<button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}
        <div className="dashboard-grid">
          <section className="panel docs-panel">
            <div className="panel-heading"><div><h2>Your documents</h2><p className="muted">Upload PDFs to build your private knowledge base.</p></div><label className="upload-button">{uploading ? 'Processing…' : '+ Upload PDF'}<input type="file" accept="application/pdf,.pdf" onChange={upload} disabled={uploading} hidden /></label></div>
            <div className="document-list">
              {documents.length === 0 && <div className="empty"><div className="empty-icon">↥</div><strong>No documents yet</strong><span>Upload a text-based PDF to get started.</span></div>}
              {documents.map(doc => <div className="document-row" key={doc._id}><div className="pdf-icon">PDF</div><div className="document-meta"><strong title={doc.originalName}>{doc.originalName}</strong><span>{(doc.sizeBytes / 1024).toFixed(0)} KB · {doc.chunkCount} chunks</span></div><span className={`doc-status ${doc.status}`}>{doc.status}</span><button className="icon-button delete" title="Delete document" onClick={() => deleteDocument(doc._id)}>×</button></div>)}
            </div>
            <p className="hint">PDFs up to 10 MB · Scanned PDFs require OCR, which isn't included.</p>
          </section>
          <section className="panel chat-panel">
            <div className="panel-heading"><div><h2>Ask your documents</h2><p className="muted">Answers are grounded in retrieved sources.</p></div><span className="sparkle">✧</span></div>
            <div className="chat-messages">
              {messages.length === 0 && <div className="chat-welcome"><div className="welcome-orb">✧</div><h3>What would you like to know?</h3><p>Ask a question about the documents in your knowledge base.</p><div className="suggestions"><button onClick={() => setQuestion('Summarize the key points in my documents.')}>Summarize key points</button><button onClick={() => setQuestion('What are the most important requirements?')}>Find requirements</button></div></div>}
              {messages.map((message, index) => <article className={`message ${message.role}`} key={`${index}-${message.role}`}><div className="message-role">{message.role === 'user' ? 'You' : '✧ DocuMind AI'}</div><p>{message.content}</p>{message.role === 'assistant' && message.citations?.length > 0 && <div className="citations"><strong>Retrieved sources</strong>{message.citations.map((c, i) => <div className="citation" key={`${c.documentId}-${c.pageNumber}-${i}`}><span className="source-ref">{c.ref || `S${i+1}`}</span><div><strong>{c.fileName}</strong><small>Page {c.pageNumber}{typeof c.score === 'number' ? ` · relevance ${(c.score * 100).toFixed(0)}%` : ''}</small><p>{c.excerpt}</p></div></div>)}</div>}</article>)}
              {busy && <div className="typing"><span></span><span></span><span></span> Searching sources and generating answer…</div>}
            </div>
            <form className="chat-form" onSubmit={ask}><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question about your documents…" rows="2" maxLength="2000" /><div className="chat-form-bottom"><span></span><button disabled={busy || !question.trim()}>{busy ? 'Thinking…' : 'Ask AI ↑'}</button></div></form>
          </section>
        </div>
      </main>
    </div>
  );
}
