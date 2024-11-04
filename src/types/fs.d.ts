export interface FileItem {
  isDirectory: boolean;
  isFile: boolean;
  name: string;
  parentPath: string;
  size?: number;
}
