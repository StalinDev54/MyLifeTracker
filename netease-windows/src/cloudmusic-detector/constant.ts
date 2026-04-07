import path from "node:path";
import { getLocalAppDataPath } from "../utils.js";
import type {
  NativeSongLoadTrack,
  PlayingPrivilegeCheckResult,
  PlayingStatusTrackIn,
} from "./types.js";

export const CLOUDMUSIC_DIR = path.join(
  getLocalAppDataPath(),
  "NetEase\\CloudMusic"
);

export const CLOUDMUSIC_ELOG_PATH = path.join(
  CLOUDMUSIC_DIR,
  "\\cloudmusic.elog"
);

export const CLOUDMUSIC_WEBDB_PATH = path.join(
  CLOUDMUSIC_DIR,
  "\\Library\\webdb.dat"
);

export const CLOUDMUSIC_ELOG_MATCHES = {
  EXIT: {
    rule: (row: string) => row.includes(`【app】,{"actionId":"exitApp"}`),
    args: (_: string) => true,
  },
  SET_PLAYING: {
    rule: (row: string) => row.includes(`【playing】,"checkPlayPrivilege",`),
    args: (row: string) => {
      const regex = /\{.*\}/;
      const matches = row.match(regex);
      return matches
        ? (JSON.parse(matches[0]) as PlayingPrivilegeCheckResult)
        : null;
    },
  },
  SET_PLAYING_POSITION: {
    rule: (row: string) => row.includes(`【playing】,"setPlayingPosition"`),
    args: (row: string) => {
      const regex = /【playing】,"setPlayingPosition",(\d+(?:\.\d+)?)/;
      const matches = row.match(regex);
      return matches ? +matches[1] : null;
    },
  },
  PLAY_ONE_TRACKIN_PLAYING_LIST: {
    rule: (row: string) =>
      row.includes(`【playing】,"playOneTrackInPlayingList"`),
    args: (row: string) => {
      const regex = /\{.*\}/;
      const matches = row.match(regex);
      return matches ? (JSON.parse(matches[0]) as PlayingStatusTrackIn) : null;
    },
  },
  NATIVE_SONG_LOAD: {
    rule: (row: string) =>
      row.includes(`【playing】,"native播放资源load完成，开始播放"`),
    args: (row: string) => {
      const regex = /\{.*\}/;
      const matches = row.match(regex);
      return matches ? (JSON.parse(matches[0]) as NativeSongLoadTrack) : null;
    },
  },
  SET_PLAYING_STATUS: {
    rule: (row: string) => row.includes(`【playing】,"native播放state"`),
    args: (row: string) => {
      const regex = /【playing】,"native播放state",(\d+),/;
      const matches = row.match(regex);
      return matches ? +matches[1] : null;
    },
  },
};
