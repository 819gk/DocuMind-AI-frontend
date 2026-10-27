import { useState } from 'react';

export default function PasswordField({ value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      Password
      <span className="password-field">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          minLength="10"
          autoComplete={autoComplete}
        />
        <button
          className="password-toggle"
          type="button"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.3 2.2-2.5 3.3M6.2 6.2C3.9 7.6 2.7 9.7 2.5 12c.5 1.3 2.3 4 5.2 5.5A10 10 0 0 0 12 19c1 0 2-.2 2.9-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </span>
    </label>
  );
}
