declare module '@numairawan/video-duration' {
  interface VideoDuration {
    duration: number;
    ms: number;
    seconds: number;
    timeScale: number;
  }
  export function videoDuration(filePath: string): Promise<VideoDuration>;
}
