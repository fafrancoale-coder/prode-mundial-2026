import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePredictionScore } from "@/lib/scoring";

export async function processScores() {
  await prisma.prediction.updateMany({
    where: {
      match: {
        OR: [
          { status: { not: MatchStatus.FINISHED } },
          { homeScore: null },
          { awayScore: null }
        ]
      }
    },
    data: {
      points: 0,
      exactHit: false,
      outcomeHit: false
    }
  });

  const finishedMatches = await prisma.match.findMany({
    where: {
      status: MatchStatus.FINISHED,
      homeScore: { not: null },
      awayScore: { not: null }
    },
    include: { predictions: true }
  });

  for (const match of finishedMatches) {
    for (const prediction of match.predictions) {
      const score = calculatePredictionScore({
        predictedHome: prediction.homeScore,
        predictedAway: prediction.awayScore,
        officialHome: match.homeScore!,
        officialAway: match.awayScore!
      });

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          points: score.points,
          exactHit: score.exactHit,
          outcomeHit: score.outcomeHit,
          lockedAt: prediction.lockedAt || match.startsAt
        }
      });
    }
  }

  const users = await prisma.user.findMany({
    where: { role: "USER" },
    include: { predictions: true }
  });

  await prisma.standing.deleteMany({});

  for (const user of users) {
    const totalPoints = user.predictions.reduce((sum, item) => sum + item.points, 0);
    const exactHits = user.predictions.filter((item) => item.exactHit).length;
    const outcomeHits = user.predictions.filter((item) => item.outcomeHit).length;

    await prisma.standing.create({
      data: {
        userId: user.id,
        username: user.username,
        totalPoints,
        exactHits,
        outcomeHits,
        predictions: user.predictions.length,
        lastUpdatedAt: new Date()
      }
    });
  }

  return { matches: finishedMatches.length, users: users.length };
}
