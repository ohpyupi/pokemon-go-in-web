import type { PublicPath } from 'wxt/browser';

/** The phases a sprite alternates between. */
type Phase = 'idle' | 'moving';

const FALLBACK_WIDTH = 32; // icons are natively 32×32, used until the img loads
const WALK_SPEED = 30; // px per second
const PAGE_WIDTH = innerWidth;

// Feel tuning: [min, max] seconds per phase.
const PHASE_DURATION: Record<Phase, readonly [number, number]> = {
  idle: [2, 5],
  moving: [1, 3],
};

/**
 * One wandering sprite: owns its DOM (root + img), its wander state, and its
 * animation loop. The background picks the dexId — this class only renders.
 */
export class PokemonSprite {
  private readonly root = document.createElement('div');
  private readonly img = document.createElement('img');

  // Wander state (the simulation), kept apart from the DOM writes below.
  private x = 0;
  private dir: 1 | -1 = 1;
  private phase: Phase = 'idle';
  private phaseLeft = this.createPhaseLeft('idle'); // seconds left in current phase
  private last = performance.now();
  private currentFace: 'pkmgw-f-left' | 'pkmgw-f-right' = 'pkmgw-f-left';
  private rafId = 0;

  constructor(dexId: number) {
    this.root.className = 'pkmgw-root';

    this.img.src = browser.runtime.getURL(
      `pokemon-icons/${dexId}.png` as PublicPath,
    );
    this.img.alt = `pokemon-${dexId}`;
    this.img.draggable = false;
    this.img.className = 'pkmgw-img pkmgw-f-left';

    this.root.append(this.img);
    document.documentElement.append(this.root);
  }

  /** Starts the wander loop. Call once after construction. */
  start(): void {
    addEventListener('resize', this.clampToViewport);
    this.rafId = requestAnimationFrame(this.frame);
  }

  /** Stops the loop and removes the sprite — e.g. the encounter ends, or a
   *  SPA navigation spawns a fresh PokemonSprite. */
  destroy(): void {
    cancelAnimationFrame(this.rafId);
    removeEventListener('resize', this.clampToViewport);
    this.root.remove();
  }

  // frame/clampToViewport are arrow properties so the browser callbacks
  // (requestAnimationFrame, addEventListener) keep `this` bound.

  /** One animation frame: tick the phase machine, then write the DOM. */
  private frame = (now: number): void => {
    const dt = Math.min((now - this.last) / 1000, 0.05); // cap huge gaps
    this.last = now;
    const prevX = this.x;
    this.phaseLeft -= dt;

    switch (this.phase) {
      case 'idle':
        if (this.phaseLeft <= 0) {
          this.phase = 'moving';
          this.phaseLeft = this.createPhaseLeft(this.phase);
          this.dir = Math.random() < 0.5 ? -1 : 1; // pick a fresh heading
        }
        break;
      case 'moving':
        this.walk(dt);
        if (this.phaseLeft <= 0) {
          this.phase = 'idle';
          this.phaseLeft = this.createPhaseLeft(this.phase);
        }
        break;
    }

    this.root.style.transform = `translate3d(${this.x}px, 0, 0)`;

    // Face the direction of actual travel this frame — dx is the only source
    // of truth, so the sprite can never face opposite to where it's moving.
    const dx = this.x - prevX;
    if (dx !== 0) {
      this.setFacing(dx > 0 ? 'pkmgw-f-right' : 'pkmgw-f-left');
    }

    this.rafId = requestAnimationFrame(this.frame);
  };

  /** One walking step: advance x and bounce off both walls. */
  private walk(dt: number): void {
    const width = this.img.offsetWidth || FALLBACK_WIDTH;
    this.x += this.dir * WALK_SPEED * dt;
    if (this.x <= 0) {
      this.x = 0;
      this.dir = 1;
    } else if (this.x >= PAGE_WIDTH - width) {
      this.x = PAGE_WIDTH - width;
      this.dir = -1;
    }
  }

  /** Random duration for a phase, in seconds. */
  private createPhaseLeft(phase: Phase): number {
    const [min, max] = PHASE_DURATION[phase];
    return min + Math.random() * (max - min);
  }

  private setFacing(face: 'pkmgw-f-left' | 'pkmgw-f-right'): void {
    if (face === this.currentFace) return;
    this.currentFace = face;
    this.img.classList.remove('pkmgw-f-left', 'pkmgw-f-right');
    this.img.classList.add(face);
  }

  /** Keep the sprite inside the viewport after a window resize. */
  private clampToViewport = (): void => {
    const width = this.img.offsetWidth || FALLBACK_WIDTH;
    this.x = Math.max(0, Math.min(this.x, PAGE_WIDTH - width));
  };
}