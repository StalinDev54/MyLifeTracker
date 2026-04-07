import fs from "node:fs";
import fsPromises from "node:fs/promises";
import Nanobus from "nanobus";
import ElogAnalysis from "./elog-analysis.js";
import { CLOUDMUSIC_ELOG_PATH } from "./constant.js";

export default class ElogListener extends Nanobus<{
  line: (line: string) => void;
}> {
  private fileSize = 0;
  private filePath = CLOUDMUSIC_ELOG_PATH;
  private watchOption = { interval: 300 };

  private _watchListener = (curr: fs.Stats) => {
    if (curr.size < this.fileSize) {
      this.fileSize = 0;
      return;
    }

    const stream = fs.createReadStream(this.filePath, {
      start: this.fileSize,
    });

    stream.on("data", (chunkBuffer: Buffer) => {
      const dataArray = new Uint8Array(chunkBuffer);
      const lines = ElogAnalysis.decode(dataArray).split("\n");
      this.emitLine(lines);
    });

    this.fileSize = curr.size;
  };

  public async start() {
    await fsPromises.access(this.filePath);
    const buffer = await fsPromises.readFile(this.filePath);
    const dataArray = new Uint8Array(buffer);
    const lines = ElogAnalysis.decode(dataArray).split("\n");

    this.fileSize = buffer.length;
    fs.watchFile(this.filePath, this.watchOption, this._watchListener);

    return lines;
  }

  public stop() {
    fs.unwatchFile(this.filePath, this._watchListener);
  }

  private emitLine(lines: string[]) {
    lines.forEach((line) => {
      line = line.trim();

      if (line.length > 0) {
        this.emit("line", line);
      }
    });
  }
}
