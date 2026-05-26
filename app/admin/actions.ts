"use server";

import { revalidatePath } from "next/cache";
import { MatchStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processScores } from "@/lib/ranking";
import { syncOfficialWorldCupResults } from "@/lib/official-results";

function asInt(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) {
    throw new Error("Resultado inválido.");
  }
  return parsed;
}

export async function updateRound(_: unknown) {
  await requireAdmin();
  try {
    const official = await syncOfficialWorldCupResults();
    const processed = await processScores();
    revalidatePath("/");
    revalidatePath("/admin");
    return {
      ok: `Actualización exitosa: ${official.updated} partidos sincronizados, ${processed.matches} partidos procesados.`
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo actualizar la fecha." };
  }
}

export async function saveOfficialResult(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const homeScore = asInt(formData.get("homeScore"));
  const awayScore = asInt(formData.get("awayScore"));

  await prisma.match.update({
    where: { id },
    data: {
      homeScore,
      awayScore,
      status: homeScore === null || awayScore === null ? MatchStatus.SCHEDULED : MatchStatus.FINISHED
    }
  });
  await processScores();
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createMatch(formData: FormData) {
  await requireAdmin();
  const homeTeam = String(formData.get("homeTeam") || "").trim();
  const awayTeam = String(formData.get("awayTeam") || "").trim();
  const stage = String(formData.get("stage") || "").trim();
  const startsAt = String(formData.get("startsAt") || "");

  if (!homeTeam || !awayTeam || !stage || !startsAt) throw new Error("Faltan datos del partido.");

  await prisma.match.create({
    data: {
      stage,
      homeTeam,
      awayTeam,
      startsAt: new Date(startsAt)
    }
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function editMatch(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const homeTeam = String(formData.get("homeTeam") || "").trim();
  const awayTeam = String(formData.get("awayTeam") || "").trim();
  const stage = String(formData.get("stage") || "").trim();
  const startsAt = String(formData.get("startsAt") || "");

  if (!homeTeam || !awayTeam || !stage || !startsAt) throw new Error("Faltan datos del partido.");

  await prisma.match.update({
    where: { id },
    data: {
      homeTeam,
      awayTeam,
      stage,
      startsAt: new Date(startsAt)
    }
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function toggleUser(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const enabled = String(formData.get("enabled")) === "true";
  await prisma.user.update({ where: { id }, data: { enabled } });
  revalidatePath("/admin");
}
