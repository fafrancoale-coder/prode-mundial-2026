import { PrismaClient, Role } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

const hashPassword = (password: string) =>
  createHash("sha256").update(password).digest("hex");

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin2026";

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { role: Role.ADMIN, passwordHash: hashPassword(adminPassword), enabled: true },
    create: {
      username: "admin",
      role: Role.ADMIN,
      passwordHash: hashPassword(adminPassword),
      enabled: true
    }
  });

  const baseMatches = [
    ["Fecha 1", 1, "México", "Por confirmar", "2026-06-11T16:00:00-03:00"],
    ["Fecha 1", 1, "Canadá", "Por confirmar", "2026-06-12T16:00:00-03:00"],
    ["Fecha 1", 1, "Estados Unidos", "Por confirmar", "2026-06-12T19:00:00-03:00"],
    ["Fecha 1", 1, "Argentina", "Por confirmar", "2026-06-13T16:00:00-03:00"],
    ["Octavos", null, "1° Grupo A", "2° Grupo B", "2026-07-04T16:00:00-03:00"],
    ["Cuartos", null, "Ganador octavos", "Ganador octavos", "2026-07-09T16:00:00-03:00"],
    ["Semifinal", null, "Ganador cuartos", "Ganador cuartos", "2026-07-14T16:00:00-03:00"],
    ["Final", null, "Ganador semifinal", "Ganador semifinal", "2026-07-19T16:00:00-03:00"]
  ] as const;

  for (const [stage, matchday, homeTeam, awayTeam, startsAt] of baseMatches) {
    await prisma.match.upsert({
      where: { externalId: `seed-${stage}-${homeTeam}-${awayTeam}` },
      update: {},
      create: {
        externalId: `seed-${stage}-${homeTeam}-${awayTeam}`,
        stage,
        matchday,
        homeTeam,
        awayTeam,
        startsAt: new Date(startsAt)
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
