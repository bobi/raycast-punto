import { runAppleScript } from "@raycast/utils";
import { exec as Exec } from "node:child_process";
import { promisify } from "node:util";
import { LayoutManager } from "./LayoutManager";

const exec = promisify(Exec);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class AppleScriptLayoutManager implements LayoutManager {
  constructor(private readonly layoutSwitchModifier: string) {
  }

  async getInstalledLayoutNames(): Promise<string[]> {
    const result = await exec(
      `defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleEnabledInputSources`,
    );
    return result.stdout
      .split("\n")
      .filter((line) => line.includes("KeyboardLayout Name"))
      .map((line) => line.split("=")[1].trim().replaceAll(/[;"']/g, ""));
  }

  async getActiveLayoutName(): Promise<string> {
    const result = await exec(
      `defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleSelectedInputSources`,
    );
    return result.stdout
      .split("\n")
      .filter((line) => line.includes("KeyboardLayout Name"))
      .map((line) => line.split("=")[1].trim().replaceAll(/[;"']/g, ""))[0];
  }

  async switchLayout(targetLayoutName: string): Promise<boolean> {
    const languages = await this.getInstalledLayoutNames();
    const currentLayoutName = await this.getActiveLayoutName();

    if (currentLayoutName === targetLayoutName) {
      return true;
    }

    let attempts = languages.length;
    while (attempts > 0) {
      await runAppleScript(
        `tell app "System Events" ${this.layoutSwitchModifier}`,
      );
      await delay(200);
      const activeLayoutName = await this.getActiveLayoutName();
      if (activeLayoutName === targetLayoutName) {
        return true;
      }
      attempts--;
    }

    return false;
  }
}
