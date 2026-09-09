import { useEffect, useRef } from 'react';
import { isPopupMessage, type PopupMessage } from '@/utils/messages';

/** Subscribe a handler to the popup messages the background broadcasts
 *  (pokedex-entry-added, …) while this component is mounted. The listener is
 *  attached once; the latest handler runs each time, so callers can inline
 *  their callback without useCallback. */
export function usePopupListener(
  handler: (message: PopupMessage) => void,
): void {
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    const listener = (message: unknown): void => {
      if (isPopupMessage(message)) latest.current(message);
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);
}
