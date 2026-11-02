export type LandingVote = "home" | "draw" | "away";

export function getLandingVoteSnapshot(): LandingVote | null;
export function getServerLandingVoteSnapshot(): null;
export function saveLandingVote(vote: LandingVote): boolean;
export function subscribeToLandingVote(onChange: () => void): () => void;
