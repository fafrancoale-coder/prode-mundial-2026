import Link from "next/link";
import { AuthBox } from "@/components/AuthBox";
import { PredictionForm } from "@/components/PredictionForm";
import { logout } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const argentinaTime = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

function groupByStage<T extends { stage: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.stage] ||= [];
    groups[item.stage].push(item);
    return groups;
  }, {});
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const [matches, standings] = await Promise.all([
    prisma.match.findMany({
      orderBy: [{ startsAt: "asc" }],
      include: { predictions: { where: { userId: user?.id || "__none__" } } }
    }),
    prisma.standing.findMany({
      orderBy: [{ totalPoints: "desc" }, { exactHits: "desc" }, { outcomeHits: "desc" }, { username: "asc" }]
    })
  ]);
  const grouped = groupByStage(matches);

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Mundial 2026</p>
          <h1>Prode del Mundial</h1>
        </div>
        <nav>
          {user?.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
          {user ? (
            <form action={logout}>
              <button className="ghost">Salir</button>
            </form>
          ) : null}
        </nav>
      </header>

      <section className="hero">
        <div>
          <h2>Pronosticá resultados exactos y competí en formato liga.</h2>
          <p>
            Podés cambiar cada predicción hasta el horario de inicio del partido. Los bloqueos se
            calculan con hora de Argentina.
          </p>
        </div>
        {!user ? <AuthBox /> : <div className="panel welcome">Hola, <strong>{user.username}</strong>.</div>}
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Tabla de posiciones</h2>
          <p>Ranking histórico del torneo</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Usuario</th>
                <th>Puntos</th>
                <th>Exactos</th>
                <th>Signo correcto</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {standings.length ? (
                standings.map((standing, index) => (
                  <tr key={standing.id}>
                    <td>{index + 1}</td>
                    <td>{standing.username}</td>
                    <td><strong>{standing.totalPoints}</strong></td>
                    <td>{standing.exactHits}</td>
                    <td>{standing.outcomeHits}</td>
                    <td>{argentinaTime.format(standing.lastUpdatedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>El ranking aparece cuando el admin procesa resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Partidos</h2>
          <p>Resultados exactos por fecha</p>
        </div>
        <div className="stage-list">
          {Object.entries(grouped).map(([stage, stageMatches]) => (
            <div className="stage" key={stage}>
              <h3>{stage}</h3>
              <div className="match-list">
                {stageMatches.map((match) => {
                  const prediction = match.predictions?.[0];
                  const locked = new Date() >= match.startsAt;
                  return (
                    <article className="match-card" key={match.id}>
                      <div className="match-main">
                        <span>{argentinaTime.format(match.startsAt)} ARG</span>
                        <strong>{match.homeTeam} vs {match.awayTeam}</strong>
                        <small>
                          {match.status === "FINISHED" && match.homeScore !== null
                            ? `Final: ${match.homeScore} - ${match.awayScore}`
                            : locked
                              ? "En juego o bloqueado"
                              : "Abierto"}
                        </small>
                      </div>
                      {user ? (
                        <PredictionForm
                          matchId={match.id}
                          locked={locked}
                          homeValue={prediction?.homeScore}
                          awayValue={prediction?.awayScore}
                        />
                      ) : (
                        <p className="login-note">Entrá para pronosticar.</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
