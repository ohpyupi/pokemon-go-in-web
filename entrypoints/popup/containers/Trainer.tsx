import type { TrainerProfile } from '@/model/trainer';
import './Trainer.css';

/** The Trainer page: the profile card and the "New game" reset. */
function Trainer({
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

export default Trainer;
