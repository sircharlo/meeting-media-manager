declare namespace Decompress {
  interface DecompressOptions {
    filter?: (file: File) => boolean;
    map?: (file: File) => File;
    plugins?: unknown[];
    strip?: number;
  }

  interface File {
    data: Buffer;
    mode?: number;
    path: string;
    type?: string;
  }
}

declare module 'decompress' {
  function decompress(
    input: string,
    output: string,
    opts?: Decompress.DecompressOptions,
  ): Promise<Decompress.File[]>;

  namespace decompress {
    export type DecompressOptions = Decompress.DecompressOptions;
  }

  export default decompress;
}

declare module 'jspdf';
declare module 'jspdf-autotable';
