import { useEffect, useState, type FormEvent } from 'react';
import {
  clearProfile,
  loadProfile,
  saveProfile,
  type TrainerProfile,
  type Gender,
} from '../../utils/trainer';
import './App.css';

const NAME_MAX = 12; // classic game limit

/** The extension version, straight from the manifest. */
const VERSION = browser.runtime.getManifest().version;

/** undefined = profile still loading from storage. */
type ProfileState = TrainerProfile | null | undefined;

function App() {
  const [profile, setProfile] = useState<ProfileState>(undefined);

  useEffect(() => {
    void loadProfile().then(setProfile);
  }, []);

  if (profile === undefined) {
    return null; // storage read is near-instant
  }

  const register = async (trainer: TrainerProfile): Promise<void> => {
    await saveProfile(trainer);
    setProfile(trainer);
  };

  const reset = async (): Promise<void> => {
    await clearProfile();
    setProfile(null);
  };

  return (
    <main className="screen">
      <p className="brand">
        <img className="brand-ball" src="/poke-ball.png" alt="" />
        Pokémon GO in Web
      </p>
      {profile === null ? (
        <Registration onRegister={register} />
      ) : (
        <TrainerCard profile={profile} onReset={() => void reset()} />
      )}
      <p className="version">v{VERSION}</p>
    </main>
  );
}

/** First run: capture the trainer's name, gender, and start time. */
function Registration({
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
    <form onSubmit={(e) => void submit(e)}>
      <h1>Welcome, Trainer!</h1>

      <label className="field" htmlFor="trainer-name">
        What is your name?
        <input
          id="trainer-name"
          type="text"
          value={name}
          maxLength={NAME_MAX}
          placeholder="e.g. Ash"
          autoFocus
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

/** Registered trainer: just the profile for now (the Pokédex will land
 *  on this screen later). */
function TrainerCard({
  profile,
  onReset,
}: {
  profile: TrainerProfile;
  onReset: () => void;
}) {
  return (
    <>
      <h1>{profile.name}</h1>
      <p className="gender-chip">
        {profile.gender === 'boy' ? '♂ Boy' : '♀ Girl'}
      </p>
      <p className="stamp">
        Adventure started{' '}
        {new Date(profile.startedAt).toLocaleString(undefined, {
          dateStyle: 'long',
          timeStyle: 'short',
        })}
      </p>

      <button type="button" className="reset" onClick={onReset}>
        New game — erase trainer
      </button>
    </>
  );
}

export default App;