import { CLOUDMUSIC_ELOG_MATCHES } from "./constant.js";

export type PlayingStatusID = string;

export type PlayingStatusArtist = {
  id: PlayingStatusID;
  name: string;
  alia?: string[];
  alias?: string[];
  transName?: string;
};

export type PlayingStatusAlbum = {
  id: PlayingStatusID;
  name: string;
  description: string;
  trackCount: number;
  subscribedCount: number;
  commentCount: number;
  commentThreadId: string;
  algorithm: string;
  size: number;
  albumName: string;
  picId: string;
  picUrl: string;
  cover: string;
  alias: string[];
  transNames: string[];
  explicit: boolean;
  override?: {
    title: "";
    subTitle: "";
    imageUrl: "";
  };
};

export type PlayingStatusFreeTrialPrivilege = {
  resConsumable: boolean;
  userConsumable: boolean;
  listenType: null;
  cannotListenReason: null;
  playReason: null;
  freeLimitTagType: null;
};

export type PlayingStatusPrivilege = {
  id: PlayingStatusID;
  fee: number;
  payed: number;
  maxPlayBr: number;
  maxDownBr: number;
  commentPriv: number;
  cloudSong: number;
  toast?: boolean;
  flag: number;
  now?: number;
  maxSongBr: number;
  maxFreeBr: number;
  sharePriv?: number;
  status: number;
  subPriv: number;
  maxSongLevel?: number;
  maxDownLevel?: number;
  maxFreeLevel?: number;
  maxPlayLevel?: number;
  freeTrialPrivilege?: PlayingStatusFreeTrialPrivilege;
};

export type PlayingStatusTrack = {
  id: PlayingStatusID;
  commentThreadId: string;
  copyrightId: string;
  duration: number;
  mvid: string;
  name: string;
  status: number;
  fee: number;
  songType: number;
  noCopyrightRcmd: null;
  originCoverType: number;
  mark: number;
  artists: PlayingStatusArtist[];
  privilege: PlayingStatusPrivilege;
  album: PlayingStatusAlbum;
  algorithm: string;
  transNames?: string[];
};

export type PlayingStatusLocalTrack = Record<string, unknown>;

export type PlayingStatusSourceData = {
  id: PlayingStatusID;
  playCount: number;
  name: string;
  coverImgUrl: string;
};

export type PlayingStatusFromInfo = {
  originalScene: string;
  originalResourceType: string;
  computeSourceResourceType: string;
  sourceData: PlayingStatusSourceData;
  trialMode: number;
};

// Reference info types
export type PlayingStatusReferInfo = {
  addrefer: string;
  multirefers: string[];
};

// Main component types
export type PlayingStatusTrackIn = {
  id: PlayingStatusID;
  displayOrder: number;
  randomOrder: number;
  isPlayedOnce: boolean;
  ai: string;
  aiRcmd: boolean;
  scene: string;
  href: string;
  text: string;
  localTrack: PlayingStatusLocalTrack;
  track: PlayingStatusTrack;
  resourceType: string;
  fromInfo: PlayingStatusFromInfo;
  resourceId: PlayingStatusID;
  trackId: PlayingStatusID;
  referInfo: PlayingStatusReferInfo;
};

export type PlayingStatus = {
  trackIn: PlayingStatusTrackIn;
  playingState: number;
  noAddToHistory: boolean;
  flag: number;
  fromType: string;
  triggerScene: string;
};

export type PlayingPrivilegeCheckResult = {
  id: string;
  alias: string[];
  commentThreadId: string;
  copyrightId: string;
  duration: number;
  mvid: string;
  name: string;
  cd: string;
  position: number;
  ringtone: string;
  rtUrl: string | null;
  status: number;
  pstatus: number;
  fee: number;
  version: number;
  songType: number;
  mst: number;
  popularity: number;
  ftype: number;
  rtUrls: string[];
  noCopyrightRcmd: string | null;
  originCoverType: number;
  mark: string;
  artists: PlayingStatusFullArtist[];
  algorithm: "";
  songTag: {};
  album: PlayingStatusAlbum;
  explicit: false;
  privilege: PlayingStatusPrivilege;
};

export type PlayingStatusFullArtist = {
  accountId: string;
  id: string;
  albumSize: number;
  alia: string[];
  alias: string[];
  fansGroup: unknown; // ?
  img1v1Url: string;
  name: string;
  picId: string;
  trans: string;
  transName: string;
  fansSize: number;
  musicSize: number;
  algorithm: string;
  override: {
    title: string;
    subTitle: string;
    imageUrl: string;
  };
};

export type PlayingStatusType = keyof typeof CLOUDMUSIC_ELOG_MATCHES;

export type DetectorAvailableStatus = {
  available: true;
  id: number;
  playing: boolean;
  position: number;
  duration: number;
  detail?: {
    name: string;
    cover: string;
    albumName: string;
    artistNames: string[];
  };
};

export type TrackIn = {
  name: string;
  cover: string;
  albumName: string;
  artists: string[];
  duration: number;
};

export type NativeSongLoadTrack = {
  bitrate: number;
  type: number;
  volumeDelta: number;
  songId: string;
  fileSize: number;
  musicurl: string;
  freeTrialInfo: unknown;
  freeTrialPrivilege: {
    resConsumable: boolean;
    userConsumable: boolean;
    listenType: string | null;
    cannotListenReason: string | null;
    playReason: string | null;
    freeLimitTagType: string | null;
  };
  level: string;
  md5: string;
  songDuration: string;
  extHeader: string;
  audioFormat: string;
  podcastCtrp: unknown;
  rightSource: number;
  audioType: string;
  br: string;
};

export type DetectorUnavailableStatus = {
  available: false;
  id: -1;
  playing: false;
  position: 0;
  duration: number;
};

export type DetectorStatus =
  | DetectorAvailableStatus
  | DetectorUnavailableStatus;
