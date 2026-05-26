import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUpdateButton } from "@/components/AdminUpdateButton";
import { createMatch, editMatch, saveOfficialResult, toggleUser } from "@/app/admin/actions";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function inputDateValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const [matches, users, predictions] = await Promise.all([
    prisma.match.findMany({ orderBy: { startsAt: "asc" } }),
    prisma.user.findMany({ orderBy: { username: "asc" } }),
    prisma.prediction.findMany({
      orderBy: { updatedAt: "desc" },
      include: { user: true, match: true },
      take: 200
    })
  ]);

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Panel privado</p>
          <h1>Administración</h1>
        </div>
        <nav>
          <Link href="/">Volver</Link>
        </nav>
      </header>

      <section className="section admin-grid">
        <div className="panel">
          <h2>Actualizar resultados oficiales</h2>
          <p>
            Sincroniza partidos del Mundial desde football-data.org, calcula puntos y actualiza la
            tabla de posiciones.
          </p>
          <AdminUpdateButton />
        </div>
        <div className="panel">
          <h2>Reglas de puntos</h2>
          <p>Marcador exacto: 3 puntos. Signo correcto sin exacto: 1 punto. Error: 0 puntos.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Editar partidos y resultados</h2>
          <p>También sirve para corregir resultados manualmente.</p>
        </div>
        <form action={createMatch} className="panel admin-match-edit create-match">
          <label>
            Fecha
            <input name="stage" placeholder="Fecha 1" required />
          </label>
          <label>
            Local
            <input name="homeTeam" placeholder="Argentina" required />
          </label>
          <label>
            Visitante
            <input name="awayTeam" placeholder="Brasil" required />
          </label>
          <label>
            Inicio
            <input name="startsAt" type="datetime-local" required />
          </label>
          <button>Crear partido</button>
        </form>
        <div className="admin-list">
          {matches.map((match) => (
            <article className="panel admin-match" key={match.id}>
              <form action={editMatch} className="admin-match-edit">
                <input type="hidden" name="id" value={match.id} />
                <label>
                  Fecha
                  <input name="stage" defaultValue={match.stage} />
                </label>
                <label>
                  Local
                  <input name="homeTeam" defaultValue={match.homeTeam} />
                </label>
                <label>
                  Visitante
                  <input name="awayTeam" defaultValue={match.awayTeam} />
                </label>
                <label>
                  Inicio
                  <input name="startsAt" type="datetime-local" defaultValue={inputDateValue(match.startsAt)} />
                </label>
                <button>Guardar partido</button>
              </form>
              <form action={saveOfficialResult} className="result-edit">
                <input type="hidden" name="id" value={match.id} />
                <input name="homeScore" type="number" min="0" max="30" defaultValue={match.homeScore ?? ""} />
                <span>-</span>
                <input name="awayScore" type="number" min="0" max="30" defaultValue={match.awayScore ?? ""} />
                <button>Guardar resultado</button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Usuarios</h2>
          <p>Habilitar o deshabilitar jugadores</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.username}</td>
                  <td>{item.role}</td>
                  <td>{item.enabled ? "Activo" : "Deshabilitado"}</td>
                  <td>
                    {item.role === "USER" ? (
                      <form action={toggleUser}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="enabled" value={String(!item.enabled)} />
                        <button className="ghost">{item.enabled ? "Deshabilitar" : "Habilitar"}</button>
                      </form>
                    ) : (
                      "Protegido"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Pronósticos</h2>
          <p>Últimos 200 pronósticos cargados</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Partido</th>
                <th>Pronóstico</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((prediction) => (
                <tr key={prediction.id}>
                  <td>{prediction.user.username}</td>
                  <td>{prediction.match.homeTeam} vs {prediction.match.awayTeam}</td>
                  <td>{prediction.homeScore} - {prediction.awayScore}</td>
                  <td>{prediction.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
