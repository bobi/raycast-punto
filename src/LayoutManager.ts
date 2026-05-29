export interface LayoutManager {
  getInstalledLayoutNames(): Promise<string[]>;

  getActiveLayoutName(): Promise<string>;

  switchLayout(targetLayoutName: string): Promise<boolean>;
}
