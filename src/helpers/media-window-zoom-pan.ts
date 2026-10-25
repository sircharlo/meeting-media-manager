// The media window's image zoom and pan, eased toward each update from the
// main window's thumbnail on a spring that is stepped once a frame.
//
// A transform here is where the image sits on screen: scaled by `scale`
// about its centre, then shifted by `x` and `y` - fractions of its own width
// and height, i.e. CSS `translate(x%, y%) scale(scale)`. Shifting after
// scaling is what lets an animated zoom hold the point being zoomed toward:
// with the shift inside the scale (`scale() translate()`), the two animate
// as a product and that point swings out and back on the way.
//
// The spring doesn't ease the scale and shift separately either. It moves
// along the zoom that turns one transform into the other: about a single
// fixed point on screen, at an even rate on a log scale, so the zoomed-toward
// point stays put the whole way and a zoom in mirrors the matching zoom out.
// A pure pan, with no change of scale, is just a straight slide.

export interface ZoomPanSpring {
  current: ZoomPanTransform;
  // How fast `current` is moving away from the target, per second.
  velocity: ZoomPanMotion;
}

export interface ZoomPanTransform {
  scale: number;
  x: number;
  y: number;
}

// A zoom about a fixed point plus a shift, as `logScale` (the log of the zoom
// factor) and `x`/`y` (in shift units); or, as a velocity, the same per
// second.
interface ZoomPanMotion {
  logScale: number;
  x: number;
  y: number;
}

export const IDENTITY_ZOOM_PAN: Readonly<ZoomPanTransform> = {
  scale: 1,
  x: 0,
  y: 0,
};

// Critically damped - the quickest a spring can settle without overshooting
// - at this natural frequency (rad/s): a jump lands within 1% in about 0.75s,
// starting gently and slowing into place, and a steady drag or zoom is
// trailed by about 0.2s. Calm enough for an audience, quick enough to keep up
// with the thumbnail.
const NATURAL_FREQUENCY = 9;

// Closer than this to the target, and slower than this, counts as there:
// 1/10,000 of the image is a fifth of a pixel on a 1920px-wide screen.
const SETTLED_DISTANCE = 1e-4;
const SETTLED_SPEED = 1e-3;

const finiteOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

// The main window sends its pan as a shift applied inside the scale
// (`scale() translate()`, as its own preview draws it); on screen that's the
// same shift times the scale.
export const zoomPanFromBroadcast = (
  state: Partial<Record<string, number>>,
): ZoomPanTransform => {
  const rawScale = finiteOr(state.scale, 1);
  const scale = rawScale > 0 ? rawScale : 1;
  return {
    scale,
    x: finiteOr(state.x, 0) * scale,
    y: finiteOr(state.y, 0) * scale,
  };
};

export const restingZoomPanSpring = (
  transform: Readonly<ZoomPanTransform>,
): ZoomPanSpring => ({
  current: { ...transform },
  velocity: { logScale: 0, x: 0, y: 0 },
});

// (e^a - 1) / a: how much of a shift a zoom by e^a carries along with it.
const zoomShiftFactor = (logScale: number) =>
  Math.abs(logScale) < 1e-12 ? 1 : Math.expm1(logScale) / logScale;

// The motion that turns `from` into `to`, as described above.
const motionBetween = (
  from: Readonly<ZoomPanTransform>,
  to: Readonly<ZoomPanTransform>,
): ZoomPanMotion => {
  const ratio = to.scale / from.scale;
  const logScale = Math.log(ratio);
  const factor = zoomShiftFactor(logScale);
  return {
    logScale,
    x: (to.x - ratio * from.x) / factor,
    y: (to.y - ratio * from.y) / factor,
  };
};

// The reverse: `transform` moved by `motion`.
const moveBy = (
  transform: Readonly<ZoomPanTransform>,
  motion: ZoomPanMotion,
): ZoomPanTransform => {
  const growth = Math.exp(motion.logScale);
  const factor = zoomShiftFactor(motion.logScale);
  return {
    scale: transform.scale * growth,
    x: transform.x * growth + motion.x * factor,
    y: transform.y * growth + motion.y * factor,
  };
};

const isSmall = (motion: ZoomPanMotion, limit: number) =>
  Math.abs(motion.logScale) < limit &&
  Math.abs(motion.x) < limit &&
  Math.abs(motion.y) < limit;

// One coordinate of a critically damped spring, `seconds` later - solved
// exactly rather than stepped, so the motion is the same at any display
// refresh rate and however unevenly frames arrive.
const settle = (offset: number, velocity: number, seconds: number) => {
  const decay = Math.exp(-NATURAL_FREQUENCY * seconds);
  const drift = velocity + NATURAL_FREQUENCY * offset;
  return {
    offset: (offset + drift * seconds) * decay,
    velocity: (velocity - drift * NATURAL_FREQUENCY * seconds) * decay,
  };
};

export const isZoomPanSpringAtRest = (
  spring: ZoomPanSpring,
  target: Readonly<ZoomPanTransform>,
) =>
  spring.velocity.logScale === 0 &&
  spring.velocity.x === 0 &&
  spring.velocity.y === 0 &&
  spring.current.scale === target.scale &&
  spring.current.x === target.x &&
  spring.current.y === target.y;

// Advances the spring toward the target by `elapsedSeconds`. Once it's close
// enough and slow enough, it lands exactly on the target, at rest.
export const stepZoomPanSpring = (
  spring: ZoomPanSpring,
  target: Readonly<ZoomPanTransform>,
  elapsedSeconds: number,
): ZoomPanSpring => {
  const seconds = Math.max(elapsedSeconds, 0);
  // Where the image is, as a motion away from the target.
  const offset = motionBetween(target, spring.current);
  const logScale = settle(offset.logScale, spring.velocity.logScale, seconds);
  const x = settle(offset.x, spring.velocity.x, seconds);
  const y = settle(offset.y, spring.velocity.y, seconds);
  const nextOffset = { logScale: logScale.offset, x: x.offset, y: y.offset };
  const velocity = {
    logScale: logScale.velocity,
    x: x.velocity,
    y: y.velocity,
  };

  if (
    isSmall(nextOffset, SETTLED_DISTANCE) &&
    isSmall(velocity, SETTLED_SPEED)
  ) {
    return restingZoomPanSpring(target);
  }
  return { current: moveBy(target, nextOffset), velocity };
};

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

// An unzoomed image needs no transform at all.
export const zoomPanToCss = ({ scale, x, y }: ZoomPanTransform) => {
  if (scale === 1 && x === 0 && y === 0) return '';
  return `translate(${round(x * 100, 4)}%, ${round(y * 100, 4)}%) scale(${round(scale, 5)})`;
};
