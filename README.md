# Prode Mundial 2026

Web app responsive lista para publicar en Vercel. Permite usuarios con nombre simple, pronósticos por partido, bloqueo automático al inicio, panel admin, resultados oficiales configurables y ranking persistente.

## Funciones incluidas

- Usuarios sin email obligatorio y contraseña opcional.
- Admin protegido por contraseña.
- Predicción de resultado exacto por partido.
- Bloqueo de edición cuando empieza cada partido.
- Puntaje: exacto 3, signo correcto 1, fallo 0.
- Tabla de posiciones persistente.
- Panel admin para editar partidos, resultados, usuarios y ver pronósticos.
- Botón admin “Actualizar fecha” para sincronizar resultados oficiales y recalcular ranking.
- Horarios mostrados para Argentina.

## Publicar online paso a paso

1. Creá una cuenta en [Vercel](https://vercel.com).
2. Creá una cuenta en [Neon](https://neon.tech) o [Supabase](https://supabase.com) para tener una base de datos Postgres.
3. En Neon o Supabase, creá un proyecto nuevo y copiá la conexión que empieza con `postgresql://`.
4. Subí esta carpeta a GitHub.
5. En Vercel tocá `Add New...` y después `Project`.
6. Elegí el repositorio de GitHub.
7. En `Environment Variables`, agregá:
   - `DATABASE_URL`: la conexión Postgres.
   - `SESSION_SECRET`: un texto largo inventado.
   - `ADMIN_PASSWORD`: tu contraseña privada de admin.
   - `FOOTBALL_DATA_TOKEN`: token gratuito de football-data.org.
8. Tocá `Deploy`.
9. Cuando termine, abrí la URL de Vercel.
10. Entrá con usuario `admin` y la contraseña que pusiste en `ADMIN_PASSWORD`.
11. En el panel admin tocá `Actualizar fecha`.
12. Compartí el link de Vercel con tus amigos.

## Fuente de resultados

La app usa football-data.org v4 con la competencia `WC` mediante:

`https://api.football-data.org/v4/competitions/WC/matches`

Necesitás un token gratuito en [football-data.org](https://www.football-data.org). La referencia oficial muestra el recurso de partidos por competencia `/v4/competitions/{id}/matches` y el código `WC` para FIFA World Cup. Si falta el token o la API falla, el panel admin muestra un error claro y podés cargar resultados manualmente.

## Comandos locales

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Luego abrí `http://localhost:3000`.

## Notas importantes

- La base de datos debe ser Postgres para producción.
- El usuario admin inicial es `admin`.
- Los partidos semilla son una base inicial editable. El botón “Actualizar fecha” importa y actualiza partidos oficiales cuando la API los entregue.
