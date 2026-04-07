import Nanobus from "nanobus";
import Webdb from "./webdb.js";
import ElogAnalysis from "./elog-analysis.js";
import ElogListener from "./elog-listener.js";
import { CLOUDMUSIC_ELOG_MATCHES } from "./constant.js";
import type { DetectorStatus, TrackIn } from "./types.js";

export class CloudmusicDetector extends Nanobus<{
  play: (songId: number) => void;
  status: (playing: boolean) => void;
  position: (position: number) => void;
}> {
  private listener = new ElogListener();
  private webdb = new Webdb();

  private currentSongId = -1;
  private currentSongName = "";
  private currentSongCover = "";
  private currentSongAlbumName = "";
  private currentSongArtistNames: string[] = [];
  private currentSongDuration = 0;

  private currentSongPosition = 0;
  private currentSongPausing = false;
  private currentSongRelativeTime = 0;

  constructor() {
    super("CLOUDMUSIC-DETECTOR");
    this.bindEvents();
  }

  public start() {
    return this.listener
      .start()
      .then((lines) => this.preloadLines(lines))
      .catch(() => {});
  }

  public stop() {
    this.listener.stop();
  }

  private async preloadLines(lines: string[]) {
    const now = Date.now();
    const records: string[] = [];

    let songId = -1;
    let songPlayTime = 0;
    let songPosition = 0;
    let songPausing = false;
    let songTrackDetail: TrackIn | null = null;

    line: for (const line of lines.reverse()) {
      const headers = ElogAnalysis.getHeader(line);

      if (!headers) {
        continue;
      }

      records.unshift(line);

      switch (ElogAnalysis.getType(line)) {
        case "EXIT": {
          this.resetState();
          return;
          // return Promise.resolve()
        }

        case "PLAY_ONE_TRACKIN_PLAYING_LIST": {
          const parser = CLOUDMUSIC_ELOG_MATCHES.PLAY_ONE_TRACKIN_PLAYING_LIST;
          const data = parser.args(line);

          if (data !== null && songId === -1) {
            songId = +data.id;
            songPlayTime = headers.timestamp;
            songTrackDetail = {
              name: data.track.name,
              cover: data.track.album.cover,
              albumName: data.track.album.name,
              artists: data.track.artists.map((item) => item.name),
              duration: data.track.duration / 1000,
            };
          }
          break line;
        }

        case "NATIVE_SONG_LOAD": {
          const parser = CLOUDMUSIC_ELOG_MATCHES.NATIVE_SONG_LOAD;
          const data = parser.args(line);

          if (data !== null && songId === -1) {
            songId = +data.songId;
            songPlayTime = headers.timestamp;

            const track = await this.webdb.waitForSongDetail(songId);
            songTrackDetail = {
              name: track.name,
              cover: track.album.cover,
              albumName: track.album.name,
              artists: track.artists.map((item) => item.name),
              duration: track.duration / 1000,
            };
          }
        }

        case "SET_PLAYING": {
          const parser = CLOUDMUSIC_ELOG_MATCHES.SET_PLAYING;
          const data = parser.args(line);

          if (data !== null && songId === -1) {
            songId = +data.id;
            songPlayTime = headers.timestamp;
            songTrackDetail = {
              name: data.name,
              cover: data.album.cover,
              albumName: data.album.name,
              artists: data.artists.map((item) => item.name),
              duration: data.duration / 1000,
            };
          }
          break line;
        }
      }
    }

    let lastActionTime = songPlayTime;

    for (const line of records) {
      const headers = ElogAnalysis.getHeader(line);

      if (!headers) {
        continue;
      }

      switch (ElogAnalysis.getType(line)) {
        // 进度拖拽
        case "SET_PLAYING_POSITION": {
          const parser = CLOUDMUSIC_ELOG_MATCHES.SET_PLAYING_POSITION;
          const position = parser.args(line);

          if (position === null) {
            break;
          }

          songPosition = position;
          lastActionTime = headers.timestamp;
          break;
        }

        // 播放状态切换 1=播放 2=暂停
        case "SET_PLAYING_STATUS": {
          const parser = CLOUDMUSIC_ELOG_MATCHES.SET_PLAYING_STATUS;
          const status = parser.args(line);

          if (status === null) {
            break;
          }

          const offset = headers.timestamp - lastActionTime;
          lastActionTime = headers.timestamp;
          songPausing = status === 2;

          if (songPausing) {
            songPosition += offset / 1000;
          }

          break;
        }
      }
    }

    if (!songPausing) {
      songPosition += (now - lastActionTime) / 1000;
    }

    this.currentSongId = songId;
    this.currentSongPausing = songPausing;
    this.currentSongPosition = songPausing ? songPosition : 0;
    this.currentSongRelativeTime = songPausing ? 0 : now - songPosition * 1000;

    if (songTrackDetail) {
      this.refreshCurrentSongDetail(songTrackDetail);
    }
  }

  private bindEvents() {
    this.listener.on("line", async (line) => {
      const headers = ElogAnalysis.getHeader(line);

      if (!headers) {
        return;
      }

      const now = Date.now();
      const offset = (now - headers.timestamp) / 1000;

      switch (ElogAnalysis.getType(line)) {
        // 软件退出
        case "EXIT": {
          this.resetState();
          this.emit("play", this.currentSongId);
          return;
        }
        // 切歌
        case "SET_PLAYING": {
          const { args } = CLOUDMUSIC_ELOG_MATCHES.SET_PLAYING;
          const data = args(line);

          if (data === null || +data.id === this.currentSongId) {
            break;
          }

          this.currentSongId = +data.id;
          this.currentSongPausing = true;
          this.currentSongPosition = 0;
          this.currentSongRelativeTime = 0;
          this.refreshCurrentSongDetail({
            name: data.name,
            cover: data.album.cover,
            albumName: data.album.name,
            artists: data.artists.map((item) => item.name),
            duration: data.duration / 1000,
          });
          this.emit("play", this.currentSongId);
          // this.refreshCurrentSongDetail().then(() => {
          //   this.emit("play", this.currentSongId)
          // })

          break;
        }

        case "PLAY_ONE_TRACKIN_PLAYING_LIST": {
          const { args } =
            CLOUDMUSIC_ELOG_MATCHES.PLAY_ONE_TRACKIN_PLAYING_LIST;
          const data = args(line);

          if (data === null || +data.id === this.currentSongId) {
            break;
          }

          this.currentSongId = +data.track.id;
          this.currentSongPausing = false;
          this.currentSongPosition = 0;
          this.currentSongRelativeTime = 0;
          this.refreshCurrentSongDetail({
            name: data.track.name,
            cover: data.track.album.cover,
            albumName: data.track.album.name,
            artists: data.track.artists.map((item) => item.name),
            duration: data.track.duration / 1000,
          });
          this.emit("play", this.currentSongId);

          break;
        }

        case "NATIVE_SONG_LOAD": {
          const parser = CLOUDMUSIC_ELOG_MATCHES.NATIVE_SONG_LOAD;
          const data = parser.args(line);

          if (data === null || +data.songId === this.currentSongId) {
            break;
          }

          const track = await this.webdb.waitForSongDetail(+data.songId, 20);
          const newRelative = now - this.currentSongPosition * 1000;
          const newPosition = (now - this.currentSongRelativeTime) / 1000;

          this.currentSongId = +data.songId;
          this.currentSongPosition = this.currentSongPausing
            ? newPosition - offset
            : 0;
          this.currentSongRelativeTime = this.currentSongPausing
            ? 0
            : newRelative - offset * 1000;

          this.refreshCurrentSongDetail({
            name: track.name,
            cover: track.album.cover,
            albumName: track.album.name,
            artists: track.artists.map((item) => item.name),
            duration: track.duration / 1000,
          });
          this.emit("play", this.currentSongId);
        }

        // 进度拖拽
        case "SET_PLAYING_POSITION": {
          const { args } = CLOUDMUSIC_ELOG_MATCHES.SET_PLAYING_POSITION;
          const position = args(line);

          if (position === null) {
            break;
          }

          this.currentSongPosition = this.currentSongPausing ? position : 0;
          this.currentSongRelativeTime = this.currentSongPausing
            ? 0
            : Date.now() - position * 1000 - offset * 1000;

          this.emit("position", this.status.position);
          break;
        }

        // 播放状态切换 1=播放 2=暂停
        case "SET_PLAYING_STATUS": {
          const { args } = CLOUDMUSIC_ELOG_MATCHES.SET_PLAYING_STATUS;
          const status = args(line);

          if (status === null) {
            break;
          }

          const newRelative = now - this.currentSongPosition * 1000;
          const newPosition = (now - this.currentSongRelativeTime) / 1000;

          this.currentSongPausing = status === 2;
          this.currentSongPosition = this.currentSongPausing
            ? newPosition - offset
            : 0;
          this.currentSongRelativeTime = this.currentSongPausing
            ? 0
            : newRelative - offset * 1000;

          this.emit("status", !this.currentSongPausing);
          break;
        }
      }
    });
  }

  private resetState() {
    this.currentSongId = -1;
    this.currentSongPosition = 0;
    this.currentSongPausing = false;
    this.currentSongRelativeTime = 0;
  }

  private async refreshCurrentSongDetail({
    name,
    cover,
    albumName,
    artists,
    duration,
  }: TrackIn) {
    this.currentSongName = name;
    this.currentSongCover = cover;
    this.currentSongAlbumName = albumName;
    this.currentSongArtistNames = artists;
    this.currentSongDuration = duration;
  }

  public get status(): DetectorStatus {
    const now = Date.now();

    return this.currentSongId === -1
      ? {
          available: false,
          id: -1,
          playing: false,
          position: 0,
          duration: 0,
        }
      : {
          available: true,
          id: this.currentSongId,
          playing: !this.currentSongPausing,
          position: Math.min(
            this.currentSongPausing
              ? this.currentSongPosition
              : (now - this.currentSongRelativeTime) / 1000,
            this.currentSongDuration
          ),
          duration: this.currentSongDuration,
          detail: {
            name: this.currentSongName,
            cover: this.currentSongCover,
            albumName: this.currentSongAlbumName,
            artistNames: this.currentSongArtistNames,
          },
        };
  }
}
