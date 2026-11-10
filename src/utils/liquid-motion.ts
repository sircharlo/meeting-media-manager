/**
 * The motion maths behind the liquid progress (LiquidFill.vue, first made for
 * UpdateProgressToast.vue) and its rolling digits, check and confetti.
 * Downloads report their progress at most once a second, and often far less
 * evenly than that, so the liquid animates continuously and treats each
 * report as a nudge rather than as the thing it draws.
 */

export interface ConfettiPiece {
  age: number;
  color: string;
  life: number;
  rotation: number;
  size: number;
  spin: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
}

export interface SpringConfig {
  damping: number;
  stiffness: number;
}

export interface WaveRiseShape {
  amplitude: number;
  height: number;
  lean: number;
  /** How high the surface sits above the bottom edge. */
  level: number;
  phase: number;
  shift: number;
  width: number;
}

export interface WaveShape {
  amplitude: number;
  edgeX: number;
  height: number;
  lean: number;
  phase: number;
  shift: number;
}

interface BubbleCircle {
  radius: number;
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const SPRING_STEPS_PER_SECOND = 240;

/**
 * A damped spring, stepped by hand once per animation frame. Its config can
 * change between steps, to calm it down without a jump.
 */
export class Spring {
  config: SpringConfig;
  target = 0;
  value = 0;
  velocity = 0;

  constructor(config: SpringConfig) {
    this.config = config;
  }

  kick(velocity: number) {
    this.velocity += velocity;
  }

  reset(value = 0) {
    this.target = value;
    this.value = value;
    this.velocity = 0;
  }

  step(seconds: number) {
    const steps = Math.max(1, Math.ceil(seconds * SPRING_STEPS_PER_SECOND));
    const stepSeconds = seconds / steps;
    const { damping, stiffness } = this.config;

    for (let i = 0; i < steps; i++) {
      const pull = stiffness * (this.target - this.value);
      this.velocity += (pull - damping * this.velocity) * stepSeconds;
      this.value += this.velocity * stepSeconds;
    }
  }
}

const INITIAL_AVERAGE_STEP = 3;
const STEP_AVERAGING = 0.35;
const LEAD_PER_AVERAGE_STEP = 0.85;
const MAX_LEAD_PERCENT = 6;
const LEAD_CEILING_PERCENT = 99;
const LEAD_TIME_CONSTANT_MS = 1400;
const RESTART_DROP_PERCENT = 1;
const QUIET_AFTER_MS = 3500;

/**
 * Turns sporadic progress reports into a value that keeps moving. Between
 * reports it eases a little ahead of the last real number, by a bounded
 * amount, and it never moves backwards unless the download really restarted.
 */
export class ProgressSmoother {
  private averageStep = INITIAL_AVERAGE_STEP;
  private lastUpdateAt: number;
  private real = 0;
  private shown = 0;

  constructor(now: number) {
    this.lastUpdateAt = now;
  }

  finish() {
    this.real = 100;
    this.shown = 100;
  }

  isQuietAt(now: number) {
    return this.real < 100 && now - this.lastUpdateAt > QUIET_AFTER_MS;
  }

  /** @returns How many percent this report moved the download forward. */
  push(percent: number, now: number) {
    const next = clamp(percent, 0, 100);
    const change = next - this.real;

    // A differential download that falls back to a full one starts over, so
    // here (and only here) the display has to go back down with it.
    if (change < -RESTART_DROP_PERCENT) {
      this.shown = next;
      this.averageStep = INITIAL_AVERAGE_STEP;
    }

    const step = Math.max(0, change);
    this.averageStep += (step - this.averageStep) * STEP_AVERAGING;
    this.real = next;
    this.lastUpdateAt = now;
    return step;
  }

  valueAt(now: number) {
    const lead = Math.min(
      this.averageStep * LEAD_PER_AVERAGE_STEP,
      MAX_LEAD_PERCENT,
      Math.max(0, LEAD_CEILING_PERCENT - this.real),
    );
    const elapsed = Math.max(0, now - this.lastUpdateAt);
    const eased = 1 - Math.exp(-elapsed / LEAD_TIME_CONSTANT_MS);

    this.shown = Math.max(this.shown, this.real + lead * eased);
    return this.shown;
  }
}

/**
 * Where each digit column of a rolling counter sits. Each position is a
 * fractional index into a 0-9-then-0 strip, and a column only starts turning
 * as the column to its right rolls over, like an odometer. Values outside
 * 0..max (a spring overshooting, say) are held at the nearest end.
 */
export const rollingDigitPositions = (input: number, max = 100) => {
  const value = clamp(input, 0, Math.min(max, 999));
  const ones = value % 10;
  const tensCarry = Math.max(0, ones - 9);
  const hundredsCarry = Math.max(0, (value % 100) - 99);

  return {
    hundreds: Math.floor(value / 100) + hundredsCarry,
    ones,
    tens: ((Math.floor(value / 10) % 10) + tensCarry) % 10,
  };
};

const WAVE_SAMPLE_SPACING = 5;
const WAVE_OVERDRAW = 2;

/**
 * How far the liquid's edge strays from its level at a point `along` it: two
 * sine waves drifting against each other, tipped by `lean` across `length`.
 */
const waveOffset = (
  along: number,
  length: number,
  { amplitude, lean, phase, shift }: Omit<WaveShape, 'edgeX' | 'height'>,
) =>
  amplitude * Math.sin(along * 0.085 + phase + shift) +
  amplitude * 0.45 * Math.sin(along * 0.19 - phase * 1.4 + shift * 2) +
  lean * (along / length - 0.5);

/** Where to sample the edge: past both ends, so the shape has no gaps. */
const waveSamples = (length: number) => {
  const samples = [-WAVE_OVERDRAW];
  for (let along = 4; along < length; along += WAVE_SAMPLE_SPACING) {
    samples.push(along);
  }
  samples.push(length + WAVE_OVERDRAW);
  return samples;
};

/** An SVG path filled from the left up to a wavy vertical edge. */
export const buildWaveFillPath = ({ edgeX, height, ...wave }: WaveShape) => {
  if (height <= 0) return '';

  const left = -WAVE_OVERDRAW;
  const bottom = height + WAVE_OVERDRAW;
  const points = [`M${left} ${left}`];

  for (const y of waveSamples(height)) {
    points.push(`L${(edgeX + waveOffset(y, height, wave)).toFixed(1)} ${y}`);
  }

  points.push(`L${left} ${bottom}Z`);
  return points.join('');
};

/** An SVG path filled from the bottom up to a wavy surface, like a glass. */
export const buildWaveRisePath = ({
  height,
  level,
  width,
  ...wave
}: WaveRiseShape) => {
  if (height <= 0 || width <= 0) return '';

  const left = -WAVE_OVERDRAW;
  const right = width + WAVE_OVERDRAW;
  const bottom = height + WAVE_OVERDRAW;
  const surface = height - level;
  const points = [`M${left} ${bottom}`];

  for (const x of waveSamples(width)) {
    points.push(`L${x} ${(surface - waveOffset(x, width, wave)).toFixed(1)}`);
  }

  points.push(`L${right} ${bottom}Z`);
  return points.join('');
};

/** A single SVG path holding every bubble as a circle. */
export const buildBubblesPath = (bubbles: BubbleCircle[]) =>
  bubbles
    .map(({ radius, x, y }) => {
      const r = radius.toFixed(2);
      const across = (radius * 2).toFixed(2);
      const start = `M${(x - radius).toFixed(1)} ${y.toFixed(1)}`;
      return `${start}a${r} ${r} 0 1 0 ${across} 0a${r} ${r} 0 1 0 -${across} 0`;
    })
    .join('');

/**
 * How long a finished liquid stays up, green, before whatever shows it moves
 * on (closes, fades, swaps in the next thing).
 */
export const LIQUID_DONE_HOLD_MS = 1100;

let liquidCount = 0;

/** A different seed for each liquid, so that neighbours don't move in step. */
export const nextLiquidSeed = () => {
  liquidCount++;
  return liquidCount * 97;
};

/**
 * A repeatable scatter in [0, 1). The particles are purely decorative, so
 * they don't need real randomness, only to look uneven.
 */
export const scatter = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const CONFETTI_COLORS = [
  'rgb(48, 117, 242)',
  'rgb(112, 164, 255)',
  '#21ba45',
  'rgb(233, 144, 61)',
  '#31ccec',
  'rgb(148, 94, 181)',
];
const CONFETTI_COUNT = 54;
const CONFETTI_GRAVITY = 980;

/** A fan of confetti thrown upwards from a point. */
export const createConfetti = (x: number, y: number) =>
  Array.from({ length: CONFETTI_COUNT }, (_, index): ConfettiPiece => {
    const angle = -2.75 + scatter(index, 0) * 2.35;
    const speed = 170 + scatter(index, 1) * 390;

    return {
      age: 0,
      color: CONFETTI_COLORS[
        Math.floor(scatter(index, 2) * CONFETTI_COLORS.length)
      ] as string,
      life: 1 + scatter(index, 3) * 0.7,
      rotation: scatter(index, 4) * 6,
      size: 5 + scatter(index, 5) * 4,
      spin: -9 + scatter(index, 6) * 18,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      x,
      y,
    };
  });

/** @returns The pieces that are still alive after this step. */
export const advanceConfetti = (pieces: ConfettiPiece[], seconds: number) => {
  for (const piece of pieces) {
    piece.age += seconds;
    piece.velocityY += CONFETTI_GRAVITY * seconds;
    piece.x += piece.velocityX * seconds;
    piece.y += piece.velocityY * seconds;
    piece.rotation += piece.spin * seconds;
  }

  return pieces.filter((piece) => piece.age < piece.life);
};
