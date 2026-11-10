import {
  advanceConfetti,
  buildBubblesPath,
  buildWaveFillPath,
  buildWaveRisePath,
  createConfetti,
  ProgressSmoother,
  rollingDigitPositions,
  scatter,
  sloshAt,
  Spring,
} from 'src/utils/liquid-motion';
import { describe, expect, it } from 'vitest';

describe('Spring', () => {
  const stepFor = (spring: Spring, seconds: number) => {
    let peak = spring.value;
    for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) {
      spring.step(1 / 60);
      peak = Math.max(peak, spring.value);
    }
    return peak;
  };

  it('overshoots its target when underdamped, then settles on it', () => {
    const spring = new Spring({ damping: 9, stiffness: 50 });
    spring.target = 100;

    const peak = stepFor(spring, 6);

    expect(peak).toBeGreaterThan(100);
    expect(spring.value).toBeCloseTo(100, 1);
  });

  it('does not overshoot when critically damped', () => {
    const spring = new Spring({ damping: 27, stiffness: 170 });
    spring.target = 100;

    expect(stepFor(spring, 6)).toBeLessThanOrEqual(100.01);
  });

  it('returns to rest after a kick', () => {
    const spring = new Spring({ damping: 14, stiffness: 260 });
    spring.reset(1);
    spring.kick(4);

    const peak = stepFor(spring, 3);

    expect(peak).toBeGreaterThan(1);
    expect(spring.value).toBeCloseTo(1, 2);
  });
});

describe('ProgressSmoother', () => {
  it('eases ahead between reports, but only by a bounded amount', () => {
    const smoother = new ProgressSmoother(0);
    smoother.push(40, 0);

    expect(smoother.valueAt(0)).toBe(40);
    expect(smoother.valueAt(1500)).toBeGreaterThan(40);
    expect(smoother.valueAt(600_000)).toBeLessThanOrEqual(46);
  });

  it('never moves backwards when a report lands behind what is shown', () => {
    const smoother = new ProgressSmoother(0);
    smoother.push(40, 0);
    const shown = smoother.valueAt(10_000);

    smoother.push(41, 10_000);

    expect(smoother.valueAt(10_000)).toBe(shown);
  });

  it('stays below 100% until the download has really finished', () => {
    const smoother = new ProgressSmoother(0);
    smoother.push(98, 0);

    expect(smoother.valueAt(600_000)).toBeLessThanOrEqual(99);

    smoother.finish();

    expect(smoother.valueAt(600_000)).toBe(100);
  });

  it('follows a download that restarts from the beginning', () => {
    const smoother = new ProgressSmoother(0);
    smoother.push(60, 0);
    smoother.valueAt(5000);

    smoother.push(2, 5000);

    expect(smoother.valueAt(5000)).toBe(2);
  });

  it('reports how far each update moved the download', () => {
    const smoother = new ProgressSmoother(0);

    expect(smoother.push(10, 0)).toBe(10);
    expect(smoother.push(25, 1000)).toBe(15);
    expect(smoother.push(25, 2000)).toBe(0);
  });

  it('treats out-of-range reports as the nearest valid value', () => {
    const smoother = new ProgressSmoother(0);

    smoother.push(140, 0);

    expect(smoother.valueAt(0)).toBe(100);
  });

  it('goes quiet only after a long silence, and never once finished', () => {
    const smoother = new ProgressSmoother(0);
    smoother.push(30, 0);

    expect(smoother.isQuietAt(3000)).toBe(false);
    expect(smoother.isQuietAt(4000)).toBe(true);

    smoother.finish();

    expect(smoother.isQuietAt(60_000)).toBe(false);
  });
});

describe('rollingDigitPositions', () => {
  it('rests each column on its digit', () => {
    expect(rollingDigitPositions(42)).toEqual({
      hundreds: 0,
      ones: 2,
      tens: 4,
    });
  });

  it('only turns the tens column as the ones column rolls over', () => {
    expect(rollingDigitPositions(18.5).tens).toBe(1);
    expect(rollingDigitPositions(19.5).tens).toBeCloseTo(1.5);
  });

  it('lands on 100', () => {
    expect(rollingDigitPositions(100)).toEqual({
      hundreds: 1,
      ones: 0,
      tens: 0,
    });
  });

  it('starts turning the hundreds column just before 100', () => {
    expect(rollingDigitPositions(99.5).hundreds).toBeCloseTo(0.5);
  });

  it('keeps a spring overshoot inside the range', () => {
    expect(rollingDigitPositions(103)).toEqual(rollingDigitPositions(100));
    expect(rollingDigitPositions(-2)).toEqual(rollingDigitPositions(0));
  });

  it('counts past 100 when given a higher ceiling', () => {
    expect(rollingDigitPositions(250, 999)).toEqual({
      hundreds: 2,
      ones: 0,
      tens: 5,
    });
    expect(rollingDigitPositions(1200, 999)).toEqual(
      rollingDigitPositions(999, 999),
    );
  });
});

describe('buildWaveFillPath', () => {
  const shape = {
    amplitude: 4,
    edgeX: 120,
    height: 76,
    lean: 0,
    phase: 1,
    shift: 0,
  };

  it('draws a closed shape anchored on the left', () => {
    const path = buildWaveFillPath(shape);

    expect(path.startsWith('M-2 -2')).toBe(true);
    expect(path.endsWith('L-2 78Z')).toBe(true);
  });

  it('draws nothing before the toast has been measured', () => {
    expect(buildWaveFillPath({ ...shape, height: 0 })).toBe('');
  });

  it('tips the surface in the direction of travel', () => {
    // The last point is the shape's bottom-left corner, not the surface.
    const surfaceXs = (path: string) =>
      [...path.matchAll(/L(-?[\d.]+) (-?\d+)/g)]
        .map(([, x]) => Number(x))
        .slice(0, -1);
    const still = surfaceXs(buildWaveFillPath({ ...shape, amplitude: 0 }));
    const leaning = surfaceXs(
      buildWaveFillPath({ ...shape, amplitude: 0, lean: 20 }),
    );

    expect(new Set(still).size).toBe(1);
    expect(leaning.at(-1)).toBeGreaterThan(leaning[0] as number);
  });
});

describe('buildWaveRisePath', () => {
  const shape = {
    amplitude: 0,
    height: 80,
    lean: 0,
    level: 30,
    phase: 1,
    shift: 0,
    width: 150,
  };
  // The last point is the shape's bottom-right corner, not the surface.
  const surfaceYs = (path: string) =>
    [...path.matchAll(/L(-?\d+) (-?[\d.]+)/g)]
      .map(([, , y]) => Number(y))
      .slice(0, -1);

  it('draws a closed shape anchored on the bottom', () => {
    const path = buildWaveRisePath(shape);

    expect(path.startsWith('M-2 82')).toBe(true);
    expect(path.endsWith('L152 82Z')).toBe(true);
  });

  it('puts a calm surface at its level above the bottom', () => {
    expect(new Set(surfaceYs(buildWaveRisePath(shape)))).toEqual(new Set([50]));
  });

  it('draws nothing before it has been measured', () => {
    expect(buildWaveRisePath({ ...shape, width: 0 })).toBe('');
    expect(buildWaveRisePath({ ...shape, height: 0 })).toBe('');
  });

  it('tips the surface when the liquid moves', () => {
    const ys = surfaceYs(buildWaveRisePath({ ...shape, lean: 20 }));

    expect(ys.at(-1)).toBeLessThan(ys[0] as number);
  });
});

describe('buildBubblesPath', () => {
  it('draws one circle per bubble', () => {
    const path = buildBubblesPath([
      { radius: 2, x: 10, y: 20 },
      { radius: 3, x: 30, y: 40 },
    ]);

    expect(path.match(/M/g)).toHaveLength(2);
    expect(path.startsWith('M8.0 20.0')).toBe(true);
  });

  it('draws nothing without bubbles', () => {
    expect(buildBubblesPath([])).toBe('');
  });
});

describe('scatter', () => {
  it('stays in range and is repeatable', () => {
    for (let index = 0; index < 200; index++) {
      const value = scatter(index, 3);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(scatter(index, 3)).toBe(value);
    }
  });
});

describe('confetti', () => {
  it('launches upwards from the given point', () => {
    const pieces = createConfetti(50, 60);

    expect(pieces.length).toBeGreaterThan(0);
    for (const piece of pieces) {
      expect(piece.x).toBe(50);
      expect(piece.y).toBe(60);
      expect(piece.velocityY).toBeLessThan(0);
      expect(piece.color).toBeTruthy();
    }
  });

  it('falls under gravity and is removed once spent', () => {
    let pieces = createConfetti(0, 0);
    const startVelocity = pieces[0]?.velocityY as number;

    pieces = advanceConfetti(pieces, 0.1);

    expect(pieces[0]?.velocityY).toBeGreaterThan(startVelocity);
    expect(advanceConfetti(pieces, 5)).toHaveLength(0);
  });
});

describe('sloshAt', () => {
  const samples = Array.from({ length: 400 }, (_, i) => sloshAt(i * 0.05));

  it('tips and bobs within -1 to 1', () => {
    for (const { bob, tilt } of samples) {
      expect(Math.abs(tilt)).toBeLessThanOrEqual(1);
      expect(Math.abs(bob)).toBeLessThanOrEqual(1);
    }
  });

  it('tips both ways, far enough to see', () => {
    const tilts = samples.map(({ tilt }) => tilt);

    expect(Math.max(...tilts)).toBeGreaterThan(0.8);
    expect(Math.min(...tilts)).toBeLessThan(-0.8);
  });
});
