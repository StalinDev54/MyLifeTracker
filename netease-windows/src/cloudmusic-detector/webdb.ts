import sqlite from "better-sqlite3";
import { CLOUDMUSIC_WEBDB_PATH } from "./constant.js";
import type { Statement } from "better-sqlite3";
import type { PlayingStatusTrack } from "./types.js";

// 备用代码，暂未启用

export default class Webdb {
  private readonly db = new sqlite(CLOUDMUSIC_WEBDB_PATH);
  private readonly commandQueryCurrentSongDetail: Statement<
    [],
    { playtime: number; jsonStr: string }
  >;

  constructor() {
    this.db.pragma("journal_mode = WAL"); // 允许读取时写入
    this.commandQueryCurrentSongDetail = this.db.prepare(`
      SELECT
        playtime,
        jsonStr
      FROM 
        historyTracks
      ORDER BY
        playtime DESC
        LIMIT 1
      
    `);
  }

  public getCurrentSongDetail(expectSongId: number): PlayingStatusTrack | null {
    const result = this.commandQueryCurrentSongDetail.get();
    if (!result) return null;

    const detail = JSON.parse(result.jsonStr) as PlayingStatusTrack;
    return +detail.id === expectSongId ? detail : null;
  }

  public async waitForSongDetail(
    expectSongId: number,
    interval = 100
  ): Promise<PlayingStatusTrack> {
    while (true) {
      const detail = this.getCurrentSongDetail(expectSongId);
      if (detail) return detail;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}
