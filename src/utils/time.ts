import { errorCatcher } from 'src/helpers/error-catcher';
import { pad } from 'src/utils/general';

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
