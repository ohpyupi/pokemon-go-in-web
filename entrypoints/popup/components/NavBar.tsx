import './NavBar.css';

/** The device's top bar: the back arrow (only when a page was pushed over
 *  the Pokedex), the brand centered, and an empty right slot reserved for
 *  a future settings button. */
export function NavBar({
  showBack,
  onBack,
}: {
  showBack: boolean;
  onBack: () => void;
}) {
  return (
    <nav className="nav-bar">
      {showBack ? (
        <button
          type="button"
          className="nav-back"
          aria-label="Back to the Pokedex"
          onClick={onBack}
        >
          ←
        </button>
      ) : (
        <span />
      )}
      <p className="brand">
        <img className="brand-ball" src="/poke-ball.png" alt="" />
        Pokémon GO in Web
      </p>
      <span />
    </nav>
  );
}
