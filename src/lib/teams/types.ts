// Team info and social links types for School/Travel ball

export type SocialPlatform =
  | 'instagram'
  | 'x'
  | 'facebook'
  | 'tiktok'
  | 'threads'
  | 'youtube'
  | 'website';

export interface SocialLink {
  id: string; // uuid
  platform: SocialPlatform;
  url: string; // required, absolute
  handle?: string; // optional, e.g. @LanaNolan02
}

export interface TeamInfo {
  teamName: string;
  coachName: string;
  coachEmail: string;
  socials: SocialLink[];
  isPublic: boolean; // toggle to show/hide on public page
}

export interface PlayerTeams {
  playerId: string;
  school: TeamInfo;
  travel: TeamInfo;
  updatedAt: string;
}

export type TeamKey = 'school' | 'travel';

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'instagram',
  'x',
  'facebook',
  'tiktok',
  'threads',
  'youtube',
  'website',
];

export const MAX_SOCIALS_PER_TEAM = 8;

export const ZERO_TEAM: TeamInfo = {
  teamName: '',
  coachName: '',
  coachEmail: '',
  socials: [],
  isPublic: true,
};

export function zeroTeams(playerId: string): PlayerTeams {
  return {
    playerId,
    school: { ...ZERO_TEAM },
    travel: { ...ZERO_TEAM },
    updatedAt: new Date().toISOString(),
  };
}