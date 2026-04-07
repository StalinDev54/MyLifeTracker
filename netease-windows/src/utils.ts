import os from "node:os"
import path from "node:path"

export function getLocalAppDataPath(): string {
  if (process.env.LOCALAPPDATA) {
    return process.env.LOCALAPPDATA
  }

  return path.join(os.homedir(), "AppData", "Local")
}
