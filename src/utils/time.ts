import { errorCatcher } from 'src/helpers/error-catcher';
import { pad } from 'src/utils/general';

/**
 * Formats time in seconds to a string in the format of 'hh:mm:ss' or 'mm:ss'
 * @param time The time in seconds
 * @returns The formatted time string
 * @example
 * formatTime(3600) // '01:00:00'
 * formatTime(60) // '01:00'
 * formatTime(0) // '00:00'
 */
export const formatTime = (time: number) => {
  try {
    if (!time) return '00:00';
    if (Number.isNaN(time)) return '..:..';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  } catch (error) {
    errorCatcher(error);
    return '..:..';
  }
};
