export function matchOutcome(home: number, away: number) {
  if (home > away) return "HOME";
  if (home < away) return "AWAY";
  return "DRAW";
}

export function calculatePredictionScore(args: {
  predictedHome: number;
  predictedAway: number;
  officialHome: number;
  officialAway: number;
}) {
  const exactHit =
    args.predictedHome === args.officialHome &&
    args.predictedAway === args.officialAway;
  const outcomeHit =
    matchOutcome(args.predictedHome, args.predictedAway) ===
    matchOutcome(args.officialHome, args.officialAway);

  return {
    points: exactHit ? 3 : outcomeHit ? 1 : 0,
    exactHit,
    outcomeHit
  };
}
