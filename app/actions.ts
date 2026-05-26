"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { clearSession, getCurrentUser, hashPassword, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanUsername(value: FormDataEntryValue | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseScore(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) {
    throw new Error("Ingresá un resultado válido entre 0 y 30.");
  }
  return parsed;
}

export async function loginOrRegister(_: unknown, formData: FormData) {
  const username = cleanUsername(formData.get("username"));
  const password = String(formData.get("password") || "");

  if (username.length < 3) return { error: "El usuario debe tener al menos 3 caracteres." };

  if (username === "admin") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || password !== adminPassword) {
      return { error: "Contraseña de admin incorrecta." };
    }
    const admin = await prisma.user.upsert({
      where: { username: "admin" },
      update: { role: "ADMIN", passwordHash: hashPassword(password), enabled: true },
      create: {
        username: "admin",
        role: "ADMIN",
        passwordHash: hashPassword(password),
        enabled: true
      }
    });
    await setSession(admin.id);
    redirect("/admin");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    if (!existing.enabled) return { error: "Este usuario está deshabilitado." };
    if (existing.passwordHash && existing.passwordHash !== hashPassword(password)) {
      return { error: "La contraseña no coincide." };
    }
    await setSession(existing.id);
    redirect("/");
  }

  try {
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: password ? hashPassword(password) : null
      }
    });
    await setSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Ese usuario ya existe. Probá iniciar sesión." };
    }
    return { error: "No se pudo crear el usuario." };
  }

  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function savePrediction(_: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero tenés que ingresar." };

  const matchId = String(formData.get("matchId") || "");
  const homeScore = parseScore(formData.get("homeScore"));
  const awayScore = parseScore(formData.get("awayScore"));

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "No encontré ese partido." };
  if (new Date() >= match.startsAt) {
    return { error: "Este partido ya empezó. El pronóstico quedó bloqueado." };
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    update: { homeScore, awayScore },
    create: { userId: user.id, matchId, homeScore, awayScore }
  });

  revalidatePath("/");
  return { ok: "Pronóstico guardado." };
}
