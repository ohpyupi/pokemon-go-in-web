import { useEffect, useState } from 'react';
import type { PokedexRow } from '@/model/pokedex';
import type { BackgroundMessage, PokedexReply } from '@/utils/messages';
import PokemonIcon from '../components/PokemonIcon';
import usePopupListener from '../hooks/usePopupListener';
import './PokedexHome.css';

/** The popup's one model read: the background answers with all 151 rows. */
const MESSAGE: BackgroundMessage = { type: 'get-pokedex-data' };

/** The home grid: one clickable icon per met species. Clicking a species
 *  opens its PokedexView detail page. */
function PokedexHome({ onOpen }: { onOpen: (row: PokedexRow) => void }) {
  const [rows, setRows] = useState<PokedexRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = async (): Promise<void> => {
    try {
      const reply = (await browser.runtime.sendMessage(MESSAGE)) as PokedexReply;
      setRows(reply.rows);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // While the home page is up, a first meeting elsewhere (another tab's
  // sprite) broadcasts the new row — merge it in place. The 151 species
  // (names, descriptions) are already in `rows`, so no refetch is needed.
  usePopupListener((message) => {
    switch (message.type) {
      case 'pokedex-entry-added': {
        const { encounter } = message;
        setRows((current) =>
          current === null
            ? current
            : current.map((row) =>
                row.dexId === encounter.dexId
                  ? {
                      ...row,
                      seenAt: encounter.seenAt,
                      seenOn: encounter.seenOn,
                    }
                  : row,
              ),
        );
        break;
      }
    }
  });

  if (failed) {
    return (
      <div className="index">
        <p className="status">Could not read the index.</p>
        <button type="button" className="retry" onClick={() => void load()}>
          Try again
        </button>
      </div>
    );
  }

  // Only met species earn a slot; the count header still shows the full
  // progress toward the 151.
  const seen = rows === null ? [] : rows.filter((row) => row.seenAt !== null);

  return (
    <div className="index">
      <p className="index-count">
        {rows === null ? 'Opening the index…' : `${seen.length} / 151 indexed`}
      </p>
      {rows !== null && seen.length > 0 && (
        <div className="index-scroll">
          <div className="index-grid">
            {seen.map((row) => (
              <button
                key={row.dexId}
                type="button"
                className="cell"
                title={`#${row.dexId} ${row.name}`}
                onClick={() => onOpen(row)}
              >
                <PokemonIcon dexId={row.dexId} alt={row.name} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PokedexHome;