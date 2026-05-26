import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  stage?: string;
  homeTeam?: { name?: string; shortName?: string };
  awayTeam?: { name?: string; shortName?: string };
  score?: {
    fullTime?: { home?: number | null; away?: number | null };
  };
};

function normalizeStatus(status: string): MatchStatus {
  if (status === "FINISHED") return MatchStatus.FINISHED;
  if (["IN_PLAY", "PAUSED"].includes(status)) return MatchStatus.LIVE;
  if (status === "POSTPONED") return MatchStatus.POSTPONED;
  if (status === "CANCELLED") return MatchStatus.CANCELLED;
  return MatchStatus.SCHEDULED;
}

export async function syncOfficialWorldCupResults() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    throw new Error("Falta configurar FOOTBALL_DATA_TOKEN en las variables de entorno.");
  }

  const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": token },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`La API de resultados respondió con error ${response.status}.`);
  }

  const data = (await response.json()) as { matches?: FootballDataMatch[] };
  const matches = data.matches || [];
  let updated = 0;

  for (const item of matches) {
    const homeScore = item.score?.fullTime?.home;
    const awayScore = item.score?.fullTime?.away;
    const homeTeam = item.homeTeam?.shortName || item.homeTeam?.name || "Por confirmar";
    const awayTeam = item.awayTeam?.shortName || item.awayTeam?.name || "Por confirmar";
    const status = normalizeStatus(item.status);

    await prisma.match.upsert({
      where: { externalId: String(item.id) },
      update: {
        stage: item.stage || `Fecha ${item.matchday || ""}`.trim(),
        matchday: item.matchday || null,
        homeTeam,
        awayTeam,
        startsAt: new Date(item.utcDate),
        status,
        homeScore: status === MatchStatus.FINISHED ? homeScore ?? null : null,
        awayScore: status === MatchStatus.FINISHED ? awayScore ?? null : null
      },
      create: {
        externalId: String(item.id),
        stage: item.stage || `Fecha ${item.matchday || ""}`.trim(),
        matchday: item.matchday || null,
        homeTeam,
        awayTeam,
        startsAt: new Date(item.utcDate),
        status,
        homeScore: status === MatchStatus.FINISHED ? homeScore ?? null : null,
        awayScore: status === MatchStatus.FINISHED ? awayScore ?? null : null
      }
    });
    updated += 1;
  }

  return { updated };
}
