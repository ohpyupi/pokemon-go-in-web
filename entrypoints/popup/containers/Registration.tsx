import { type FormEvent, useState } from 'react';
import type { Gender, TrainerProfile } from '@/model/trainer';
import './Registration.css';

const NAME_MAX = 12; // classic game limit

/** First run: capture the trainer's name, gender, and start time. */
export function Registration({
  onRegister,
}: {
  onRegister: (trainer: TrainerProfile) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a trainer name.');
      return;
    }
    if (trimmed.length > NAME_MAX) {
      setError(`Trainer names are at most ${NAME_MAX} characters.`);
      return;
    }
    if (!gender) {
      setError('Are you a boy or a girl?');
      return;
    }
    try {
      setError(null);
      // The current time is the third seed ingredient — captured here,
      // at the moment the adventure begins.
      await onRegister({ name: trimmed, gender, startedAt: Date.now() });
    } catch {
      setError('Could not save your trainer. Please try again.');
    }
  };

  return (
    <form className="view" onSubmit={(e) => void submit(e)}>
      <h1>Welcome, Trainer!</h1>

      <label className="field" htmlFor="trainer-name">
        What is your name?
        <input
          id="trainer-name"
          type="text"
          value={name}
          maxLength={NAME_MAX}
          placeholder="e.g. Ash"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <p className="field-label">Are you a boy or a girl?</p>
      <div className="gender-options">
        {(['boy', 'girl'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`gender-btn${gender === option ? ' selected' : ''}`}
            onClick={() => setGender(option)}
          >
            {option === 'boy' ? '♂' : '♀'} {option === 'boy' ? 'BOY' : 'GIRL'}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="cta">
        Begin your adventure
      </button>
    </form>
  );
}
