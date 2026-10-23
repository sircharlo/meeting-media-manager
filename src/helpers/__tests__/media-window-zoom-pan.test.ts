import { describe, expect, it } from 'vitest';

import {
  IDENTITY_ZOOM_PAN,
  isZoomPanSpringAtRest,
  restingZoomPanSpring,
  stepZoomPanSpring,
  zoomPanFromBroadcast,
  type ZoomPanSpring,
  zoomPanToCss,
  type ZoomPanTransform,
} from '../media-window-zoom-pan';

// Steps the spring frame by frame, like the media window's animation loop,
// and returns every frame's transform.
const animate = (
  from: ZoomPanTransform,
  to: ZoomPanTransform,
  seconds: number,
  framesPerSecond = 60,
) => {
  let spring: ZoomPanSpring = restingZoomPanSpring(from);
  const frames: ZoomPanTransform[] = [];
  const frameCount = Math.round(seconds * framesPerSecond);
  for (let frame = 0; frame < frameCount; frame++) {
    spring = stepZoomPanSpring(spring, to, 1 / framesPerSecond);
    frames.push(spring.current);
  }
  return { frames, spring };
};

// Where an image point (relative to the image's centre, in fractions of its
// size) shows up on screen under a transform.
const onScreen = (
  transform: ZoomPanTransform,
  point: number,
  axis: 'x' | 'y',
) => transform[axis] + transform.scale * point;

describe('zoomPanFromBroadcast', () => {
  it("turns the main window's inside-the-scale pan into an on-screen shift", () => {
    expect(zoomPanFromBroadcast({ scale: 2, x: 0.1, y: -0.05 })).toEqual({
      scale: 2,
      x: 0.2,
      y: -0.1,
    });
  });

  it.each([
    ['nothing at all', {}],
    ['a pan that came out as NaN', { scale: 1, x: Number.NaN, y: Number.NaN }],
    ['a pan that came out infinite', { scale: 1, x: Infinity, y: -Infinity }],
    ['a zero scale', { scale: 0, x: 0, y: 0 }],
  ])('falls back to unzoomed for %s', (_, state) => {
    expect(zoomPanFromBroadcast(state)).toEqual(IDENTITY_ZOOM_PAN);
  });
});

describe('zoomPanToCss', () => {
  it('shifts after scaling, in fractions of the image size', () => {
    expect(zoomPanToCss({ scale: 2.5, x: 0.25, y: -0.123_456_78 })).toBe(
      'translate(25%, -12.3457%) scale(2.5)',
    );
  });

  it('leaves an unzoomed image without a transform', () => {
    expect(zoomPanToCss(IDENTITY_ZOOM_PAN)).toBe('');
  });
});

describe('stepZoomPanSpring', () => {
  const zoomedIn = { scale: 3, x: -0.6, y: 0.3 };

  it('lands within 1% in about 0.75s, then settles exactly on the target, without overshooting', () => {
    const almostThere = animate(IDENTITY_ZOOM_PAN, zoomedIn, 0.75).spring;
    expect(Math.log(almostThere.current.scale) / Math.log(3)).toBeGreaterThan(
      0.99,
    );
    expect(isZoomPanSpringAtRest(almostThere, zoomedIn)).toBe(false);

    const { frames, spring } = animate(IDENTITY_ZOOM_PAN, zoomedIn, 1.5);
    expect(isZoomPanSpringAtRest(spring, zoomedIn)).toBe(true);
    let previousScale = 1;
    for (const frame of frames) {
      expect(frame.scale).toBeGreaterThanOrEqual(previousScale);
      expect(frame.scale).toBeLessThanOrEqual(zoomedIn.scale);
      previousScale = frame.scale;
    }
  });

  it('is still on its way halfway through', () => {
    const { spring } = animate(IDENTITY_ZOOM_PAN, zoomedIn, 0.3);

    expect(isZoomPanSpringAtRest(spring, zoomedIn)).toBe(false);
    expect(spring.current.scale).toBeGreaterThan(1.5);
    expect(spring.current.scale).toBeLessThan(3);
  });

  it('starts gently from a standstill', () => {
    const { spring } = animate(IDENTITY_ZOOM_PAN, zoomedIn, 1 / 60);

    // Less than 2% of the way (on a log scale) after the first frame.
    expect(Math.log(spring.current.scale) / Math.log(3)).toBeLessThan(0.02);
  });

  it('keeps the point being zoomed toward in place the whole way', () => {
    // Zooming 3x toward the image point at 30% right of and 15% below its
    // centre leaves that point where it was on screen.
    const point = { x: 0.3, y: 0.15 };
    const target = {
      scale: 3,
      x: point.x * (1 - 3),
      y: point.y * (1 - 3),
    };
    const { frames } = animate(IDENTITY_ZOOM_PAN, target, 1);

    for (const frame of frames) {
      expect(onScreen(frame, point.x, 'x')).toBeCloseTo(point.x, 9);
      expect(onScreen(frame, point.y, 'y')).toBeCloseTo(point.y, 9);
    }
  });

  it('keeps that point in place when zooming back out (as on a reset)', () => {
    const { frames } = animate(zoomedIn, IDENTITY_ZOOM_PAN, 1);
    // The image point that's at the same spot on screen before and after.
    const point = zoomedIn.x / (1 - zoomedIn.scale);
    const spot = onScreen(zoomedIn, point, 'x');

    for (const frame of frames) {
      expect(onScreen(frame, point, 'x')).toBeCloseTo(spot, 9);
    }
  });

  it('zooms evenly, so zooming in mirrors zooming out', () => {
    const fourTimes = { scale: 4, x: 0, y: 0 };
    const zoomIn = animate(IDENTITY_ZOOM_PAN, fourTimes, 1).frames;
    const zoomOut = animate(fourTimes, IDENTITY_ZOOM_PAN, 1).frames;

    expect(zoomOut).toHaveLength(zoomIn.length);
    zoomIn.forEach((frame, index) => {
      expect(frame.scale * (zoomOut[index]?.scale ?? 0)).toBeCloseTo(4, 9);
    });
  });

  it('slides a pan without changing the zoom', () => {
    const from = { scale: 2, x: 0, y: 0 };
    const to = { scale: 2, x: 0.4, y: -0.2 };
    const { frames } = animate(from, to, 1);

    for (const frame of frames) {
      expect(frame.scale).toBe(2);
      // A straight line from start to end.
      expect(frame.y).toBeCloseTo(-frame.x / 2, 9);
    }
  });

  it('moves the same at any display refresh rate', () => {
    const at30 = animate(IDENTITY_ZOOM_PAN, zoomedIn, 1 / 3, 30).spring.current;
    const at144 = animate(IDENTITY_ZOOM_PAN, zoomedIn, 1 / 3, 144).spring
      .current;

    expect(at144.scale).toBeCloseTo(at30.scale, 9);
    expect(at144.x).toBeCloseTo(at30.x, 9);
    expect(at144.y).toBeCloseTo(at30.y, 9);
  });

  it('follows a steady drag about 0.2s behind, without stopping and starting', () => {
    const speed = 0.5; // of the image's width per second
    let spring = restingZoomPanSpring({ scale: 2, x: 0, y: 0 });
    let previousX = 0;
    let previousMove = 0;
    for (let frame = 1; frame <= 90; frame++) {
      const target = { scale: 2, x: (speed * frame) / 60, y: 0 };
      spring = stepZoomPanSpring(spring, target, 1 / 60);
      const move = spring.current.x - previousX;
      // Speeds up smoothly, never slowing down while the drag goes on.
      expect(move).toBeGreaterThan(previousMove - 1e-12);
      previousX = spring.current.x;
      previousMove = move;
    }

    const lagSeconds = (speed * 1.5 - spring.current.x) / speed;
    expect(lagSeconds).toBeGreaterThan(0.18);
    expect(lagSeconds).toBeLessThan(0.25);
  });

  it('ignores a negative frame time', () => {
    const spring = restingZoomPanSpring(IDENTITY_ZOOM_PAN);

    expect(stepZoomPanSpring(spring, zoomedIn, -0.01)).toEqual(spring);
  });
});
