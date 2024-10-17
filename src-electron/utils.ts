import {captureException} from '@sentry/browser';

const errorCatcher = (error: Error | string | unknown) => {
  if (process.env.NODE_ENV === 'production') {
    captureException(error);
  } else {
    console.error(error);
  }
};

type Func<T extends unknown[], R> = (...args: T) => R;

function throttle<T extends unknown[], R = unknown>(fn: Func<T, R>, limit = 250): Func<T, R> {
  let wait = false;
  let result: R;

  return function (this: unknown, ...args: T): R {
    if (!wait) {
      wait = true;
      setTimeout(() => { wait = false; }, limit);
      result = fn.apply(this, args);
    }

    return result;
  };
}

export { errorCatcher, throttle };
