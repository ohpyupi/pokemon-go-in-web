import { useEffect, useState } from 'react';
import type { PokedexRow } from '@/model/pokedex';
import type { TrainerData } from '@/model/trainer';
import type { Friend } from '@/model/types';
import { sendRequestToBackground } from '@/utils/messages';
import { NavBar } from './components/NavBar';
import { Friends } from './containers/Friends';
import { PokedexEntry } from './containers/PokedexEntry';
import { PokedexHome } from './containers/PokedexHome';
import { Receive } from './containers/Receive';
import { Registration } from './containers/Registration';
import { Trainer } from './containers/Trainer';
import { usePopupListener } from './hooks/usePopupListener';
import './App.css';

/** The extension version, straight from the manifest. */
const VERSION = browser.runtime.getManifest().version;

const TABS = ['pokedex', 'trainer', 'receive', 'friends'] as const;

/** undefined = profile still loading from storage. */
type ProfileState = TrainerData | null | undefined;

/** The device pages: the Pokedex (home grid), the tabs, plus one entry
 *  pushed on top of the Pokedex (its single species' record, tabs hidden). */
type Page = 'pokedex' | 'pokedex-entry' | 'friends' | 'receive' | 'trainer';

/** The device shell: brand header, the trainer gate, and the page tabs. */
export function App() {
  const [profile, setProfile] = useState<ProfileState>(undefined);
  const [page, setPage] = useState<Page>('pokedex');
  /** The species opened from the home grid — rendered on the entry page. */
  const [entry, setEntry] = useState<PokedexRow | null>(null);
  const [friends, setFriends] = useState<Record<string, Friend>>({});

  useEffect(() => {
    void (async () => {
      const [profileReply, friendsReply] = await Promise.all([
        sendRequestToBackground({ type: 'get-profile' }),
        sendRequestToBackground({ type: 'get-friends' }),
      ]);
      setProfile(profileReply.profile);
      setFriends(
        Object.fromEntries(
          friendsReply.friends.map((friend) => [friend.address, friend]),
        ),
      );
    })();
  }, []);

  usePopupListener((message) => {
    if (message.type === 'profile-changed') setProfile(message.profile);
    if (message.type === 'friend-changed') {
      if (message.op === 'remove') {
        const { address } = message;
        setFriends((prev) => {
          const next = { ...prev };
          delete next[address];
          return next;
        });
      } else {
        const { friend } = message;
        setFriends((prev) => ({ ...prev, [friend.address]: friend }));
      }
    }
  });

  if (profile === undefined) {
    return null; // storage read is near-instant
  }

  const register = async (trainer: TrainerData): Promise<void> => {
    await sendRequestToBackground({ type: 'register-trainer', ...trainer });
    setEntry(null);
    setPage('pokedex'); // a fresh adventure starts at the Pokedex
  };

  const reset = async (): Promise<void> => {
    await sendRequestToBackground({ type: 'reset-trainer' });
    setEntry(null);
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
        <PokedexEntry row={entry} friends={friends} />
      ) : (
        <div className="device">
          <nav className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab${page === tab ? ' selected' : ''}`}
                onClick={() => setPage(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
          {page === 'pokedex' && <PokedexHome onOpen={openEntry} />}
          {page === 'friends' && <Friends friends={friends} />}
          {page === 'receive' && <Receive address={profile.address} />}
          {page === 'trainer' && (
            <Trainer profile={profile} onReset={() => void reset()} />
          )}
        </div>
      )}
      <p className="version">v{VERSION}</p>
    </main>
  );
}
