import aliasesByCompetition from "../data/team-aliases.json";

export type TeamIdentitySource = "exact" | "alias" | "unmatched";

export type TeamIdentity = {
  originalName: string;
  canonicalName: string;
  source: TeamIdentitySource;
};

export function normalizeTeamKey(name: string) {
  const tokens = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ");
  const legalClubTokens = new Set(["afc", "cfc", "cf", "fc"]);
  while (tokens.length && legalClubTokens.has(tokens[0])) tokens.shift();
  while (tokens.length && legalClubTokens.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(" ");
}

function getKnownTeamByKey(knownTeams: Iterable<string>) {
  const index = new Map<string, string>();
  for (const team of knownTeams) {
    index.set(normalizeTeamKey(team), team);
  }
  return index;
}

export function resolveTeamIdentity(
  competition: keyof typeof aliasesByCompetition,
  name: string,
  knownTeams: Iterable<string>,
): TeamIdentity {
  const originalName = name.trim();
  const knownTeamByKey = getKnownTeamByKey(knownTeams);
  const directMatch = knownTeamByKey.get(normalizeTeamKey(originalName));
  if (directMatch) {
    return { originalName, canonicalName: directMatch, source: "exact" };
  }

  const aliases = aliasesByCompetition[competition] ?? {};
  for (const [canonicalName, variants] of Object.entries(aliases)) {
    if (variants.some((variant) => normalizeTeamKey(variant) === normalizeTeamKey(originalName))) {
      const knownCanonical = knownTeamByKey.get(normalizeTeamKey(canonicalName));
      return {
        originalName,
        canonicalName: knownCanonical ?? canonicalName,
        source: "alias",
      };
    }
  }

  return { originalName, canonicalName: originalName, source: "unmatched" };
}
