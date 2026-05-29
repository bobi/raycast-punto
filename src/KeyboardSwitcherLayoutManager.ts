import { exec as Exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { LayoutManager } from "./LayoutManager";

const exec = promisify(Exec);

export class KeyboardSwitcherLayoutManager implements LayoutManager {
  private binaryPath: string | null = null;

  private async getBinaryPath(): Promise<string> {
    if (this.binaryPath) return this.binaryPath;

    const commonPaths = [
      "/opt/homebrew/bin/keyboardSwitcher",
      "/usr/local/bin/keyboardSwitcher",
    ];

    for (const path of commonPaths) {
      if (existsSync(path)) {
        this.binaryPath = path;
        return path;
      }
    }

    // Fallback to environment PATH
    this.binaryPath = "keyboardSwitcher";
    return "keyboardSwitcher";
  }

  async getInstalledLayoutNames(): Promise<string[]> {
    try {
      const bin = await this.getBinaryPath();
      const { stdout } = await exec(`${bin} json`);
      const layouts = JSON.parse(stdout) as { title: string; arg: string }[];
      return layouts.map((l) => l.title);
    } catch (error) {
      console.error(
        "Failed to get installed layouts with keyboardSwitcher",
        error,
      );
      return [];
    }
  }

  async getActiveLayoutName(): Promise<string> {
    try {
      const bin = await this.getBinaryPath();
      const { stdout } = await exec(`${bin} get`);
      return stdout.trim();
    } catch (error) {
      console.error("Failed to get active layout with keyboardSwitcher", error);
      return "";
    }
  }

  async switchLayout(targetLayoutName: string): Promise<boolean> {
    try {
      const bin = await this.getBinaryPath();
      await exec(`${bin} select "${targetLayoutName}"`);
      return true;
    } catch (error) {
      console.error(
        `Failed to switch layout to ${targetLayoutName} with keyboardSwitcher`,
        error,
      );
      return false;
    }
  }
}
