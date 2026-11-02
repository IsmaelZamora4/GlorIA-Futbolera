const voteKey = "gloria-landing-preview-vote:v1";
const voteChangedEvent = "gloria-landing-preview-vote-change";
const validVotes = new Set(["home", "draw", "away"]);

export function getLandingVoteSnapshot() {
  if (typeof window === "undefined") return null;

  try {
    const storedVote = window.localStorage.getItem(voteKey);
    return validVotes.has(storedVote) ? storedVote : null;
  } catch {
    return null;
  }
}

export function getServerLandingVoteSnapshot() {
  return null;
}

export function subscribeToLandingVote(onChange) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event) => {
    if (event.key === null || event.key === voteKey) onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(voteChangedEvent, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(voteChangedEvent, onChange);
  };
}

export function saveLandingVote(vote) {
  if (!validVotes.has(vote) || typeof window === "undefined") return false;

  let saved = false;
  try {
    window.localStorage.setItem(voteKey, vote);
    saved = true;
  } catch {
    // La vista conserva la elección en estado de React durante esta visita.
  }

  window.dispatchEvent(new Event(voteChangedEvent));
  return saved;
}
