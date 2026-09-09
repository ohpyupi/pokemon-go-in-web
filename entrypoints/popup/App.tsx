import { useEffect, useState } from 'react';
import type { PokedexRow } from '@/model/pokedex';
import {
  clearProfile,
  loadProfile,
  saveProfile,
  type TrainerProfile,
} from '@/model/trainer';
import { NavBar } from './components/NavBar';
import { PokedexEntry } from './containers/PokedexEntry';
import { PokedexHome } from './containers/PokedexHome';
import { Registration } from './containers/Registration';
import { Trainer } from './containers/Trainer';
import './App.css';

/** The extension version, straight from the manifest. */
const VERSION = browser.runtime.getManifest().version;

/** undefined = profile still loading from storage. */
type ProfileState = TrainerProfile | null | undefined;

/** The device pages: the Pokedex (home grid), the tabs, plus one entry
 *  pushed on top of the Pokedex (its single species' record, tabs hidden). */
type Page = 'pokedex' | 'pokedex-entry' | 'trainer';

/** The device shell: brand header, the trainer gate, and the page tabs. */
export function App() {
  const [profile, setProfile] = useState<ProfileState>(undefined);
  const [page, setPage] = useState<Page>('pokedex');
  /** The species opened from the home grid — rendered on the entry page. */
  const [entry, setEntry] = useState<PokedexRow | null>(null);

  useEffect(() => {
    void loadProfile().then(setProfile);
  }, []);

  if (profile === undefined) {
    return null; // storage read is near-instant
  }

  const register = async (trainer: TrainerProfile): Promise<void> => {
    await saveProfile(trainer);
    setProfile(trainer);
    setEntry(null);
    setPage('pokedex'); // a fresh adventure starts at the Pokedex
  };

  const reset = async (): Promise<void> => {
    await clearProfile();
    setEntry(null);
    setProfile(null);
  };

  const openEntry = (row: PokedexRow): void => {
    setEntry(row);
    setPage('pokedex-entry');
  };

  return (
    <main className="screen">
      <NavBar
        showBack={page === 'pokedex-entry' && entry !== null}
        onBack={() => setPage('pokedex')}
      />
      {profile === null ? (
        <Registration onRegister={register} />
      ) : page === 'pokedex-entry' && entry !== null ? (
        <PokedexEntry row={entry} />
      ) : (
        <div className="device">
          <nav className="tabs">
            <button
              type="button"
              className={`tab${page === 'pokedex' ? ' selected' : ''}`}
              onClick={() => setPage('pokedex')}
            >
              Pokedex
            </button>
            <button
              type="button"
              className={`tab${page === 'trainer' ? ' selected' : ''}`}
              onClick={() => setPage('trainer')}
            >
              Trainer
            </button>
          </nav>
          {page === 'pokedex' ? (
            <PokedexHome onOpen={openEntry} />
          ) : (
            <Trainer profile={profile} onReset={() => void reset()} />
          )}
        </div>
      )}
      <p className="version">v{VERSION}</p>
    </main>
  );
}
