import {
  showHUD,
  Clipboard,
  getSelectedText,
  getPreferenceValues,
} from "@raycast/api";
import { en_ru, ru_en } from "./Dict";
import { AppleScriptLayoutManager } from "./AppleScriptLayoutManager";
import { KeyboardSwitcherLayoutManager } from "./KeyboardSwitcherLayoutManager";

interface Preferences {
  layoutManager: "appleScript" | "keyboardSwitcher";
  layoutSwitchModifier: string;
  latLayoutName: string;
  cyrLayoutName: string;
  showSuccessHUD: boolean;
}

enum Layout {
  LAT = "LAT",
  CYR = "CYR",
}

export default async function main() {
  // genMap();
  // return;
  let input = "";
  try {
    input = await getSelectedText();
  } catch (error) {
    console.log("unable to get selected text", error);
  }

  if (input === "" || input.trim() === "") {
    await showHUD("Nothing to switch");
    return;
  }

  const switchedText = switchStringLayout(input);
  // console.log(switchedText);
  await Clipboard.paste(switchedText);

  const preferences = getPreferenceValues<Preferences>();
  await switchKeyboardLayout(preferences, detectLayout(switchedText));
}

function switchStringLayout(string: string): string {
  const chars: string[] = [...string];
  return chars.map((ch) => switchCharacterLayout(ch)).join("");
}

async function switchKeyboardLayout(
  preferences: Preferences,
  targetLayout: Layout,
): Promise<void> {
  const layoutManager =
    preferences.layoutManager === "keyboardSwitcher"
      ? new KeyboardSwitcherLayoutManager()
      : new AppleScriptLayoutManager(preferences.layoutSwitchModifier);
  const languages = await layoutManager.getInstalledLayoutNames();

  console.log("installed layout names are " + languages.join(", "));
  console.log("target layout is " + targetLayout);

  const targetLayoutName =
    targetLayout === Layout.LAT
      ? preferences.latLayoutName
      : preferences.cyrLayoutName;

  if (!languages.includes(targetLayoutName)) {
    await showHUD(
      "Layout " +
      targetLayoutName +
      " is not installed. Please install it or update the preferences",
    );
    return;
  }

  const success = await layoutManager.switchLayout(targetLayoutName);

  if (success) {
    if (preferences.showSuccessHUD) {
      await showHUD("Layout switched!");
    }
    console.log("layout switched");
  } else {
    await showHUD("Failed to switch layout, please check the preferences");
    console.log("failed to switch layout");
  }
}

function detectLayout(input: string): Layout {
  const array = input.split("");
  const enChars = array.filter((c) => en_ru.has(c)).length;
  const ruChars = array.filter((c) => ru_en.has(c)).length;
  return enChars > ruChars ? Layout.LAT : Layout.CYR;
}

function switchCharacterLayout(char: string): string {
  if (en_ru.has(char)) {
    console.log(char + " detected in en dict");
    return en_ru.get(char) ?? char;
  } else {
    console.log(char + " is probably detected in ru dict");
    return ru_en.get(char) ?? char;
  }
}
