export type TAudioPill = {
  id: string;
  name: string;
  file: File;
  url: string;
  duration?: number;
}

export type TAudioTrack = {
  id: string
  name: string
  pills: TAudioPill[]
}

export type TAppState = {
  tracks: TAudioTrack[]
  isPlaying: boolean
  currentTime: number
}