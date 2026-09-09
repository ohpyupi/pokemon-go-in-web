import { useEffect, useState } from 'react';
import type { PokedexRow } from '@/model/pokedex';
import { sendRequestToBackground } from '@/utils/messages';
import { PokemonIcon } from '../components/PokemonIcon';
import { usePopupListener } from '../hooks/usePopupListener';
import './PokedexHome.css';

/** The home grid: one clickable icon per met species. Clicking a species
 *  opens its PokedexView detail page. */
export function PokedexHome({ onOpen }: { onOpen: (row: PokedexRow) => void }) {
  const [rows, setRows] = useState<PokedexRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = async (): Promise<void> => {
    try {
      // The popup's one model read: the background answers with all 151 rows.
      const reply = await sendRequestToBackground({ type: 'get-pokedex-data' });
      setRows(reply.rows);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // While the home page is up, a species' first find elsewhere (another
  // tab's sprite) broadcasts its dex id — light the cell in place. The 151
  // species (names, descriptions) are already in `rows`, so no refetch is
  // needed. (The home rows carry no discovery data; the entry page fetches
  // it when opened.)
  usePopupListener((message) => {
    switch (message.type) {
      case 'pokedex-entry-added': {
        const { dexId } = message;
        setRows((current) =>
          current === null
            ? current
            : current.map((row) =>
                row.dexId === dexId ? { ...row, met: true } : row,
              ),
        );
        break;
      }
    }
  });

  if (failed) {
    return (
      <div className="view">
        <p className="status">Could not read the index.</p>
        <button type="button" className="retry" onClick={() => void load()}>
          Try again
        </button>
      </div>
    );
  }

  // Only found species earn a slot; the count header still shows the full
  // progress toward the 151.
  const met = rows === null ? [] : rows.filter((row) => row.met);

  return (
    <div className="view">
      <p className="index-count">
        {rows === null
          ? 'Opening the index…'
          : `${met.length} / 151 discovered`}
      </p>
      {rows !== null && met.length > 0 && (
        <div className="index-grid">
          {met.map((row) => (
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
      )}
    </div>
  );
}
