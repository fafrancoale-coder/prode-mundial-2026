CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
  "id" TEXT NOT NULL,
  "externalId" TEXT,
  "stage" TEXT NOT NULL,
  "matchday" INTEGER,
  "homeTeam" TEXT NOT NULL,
  "awayTeam" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prediction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "homeScore" INTEGER NOT NULL,
  "awayScore" INTEGER NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "exactHit" BOOLEAN NOT NULL DEFAULT false,
  "outcomeHit" BOOLEAN NOT NULL DEFAULT false,
  "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Standing" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "exactHits" INTEGER NOT NULL DEFAULT 0,
  "outcomeHits" INTEGER NOT NULL DEFAULT 0,
  "predictions" INTEGER NOT NULL DEFAULT 0,
  "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Standing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Match_externalId_key" ON "Match"("externalId");
CREATE INDEX "Match_startsAt_idx" ON "Match"("startsAt");
CREATE INDEX "Match_stage_idx" ON "Match"("stage");
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");
CREATE UNIQUE INDEX "Prediction_userId_matchId_key" ON "Prediction"("userId", "matchId");
CREATE UNIQUE INDEX "Standing_userId_key" ON "Standing"("userId");

ALTER TABLE "Prediction"
  ADD CONSTRAINT "Prediction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Prediction"
  ADD CONSTRAINT "Prediction_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
