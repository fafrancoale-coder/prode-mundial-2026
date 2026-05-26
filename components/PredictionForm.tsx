"use client";

import { useActionState } from "react";
import { savePrediction } from "@/app/actions";

type Props = {
  matchId: string;
  locked: boolean;
  homeValue?: number;
  awayValue?: number;
};

export function PredictionForm({ matchId, locked, homeValue, awayValue }: Props) {
  const [state, action, pending] = useActionState(savePrediction, null);

  return (
    <form action={action} className="prediction-form">
      <input type="hidden" name="matchId" value={matchId} />
      <input
        name="homeScore"
        type="number"
        min="0"
        max="30"
        defaultValue={homeValue ?? ""}
        aria-label="Goles local"
        disabled={locked}
        required
      />
      <span>-</span>
      <input
        name="awayScore"
        type="number"
        min="0"
        max="30"
        defaultValue={awayValue ?? ""}
        aria-label="Goles visitante"
        disabled={locked}
        required
      />
      <button disabled={locked || pending}>{locked ? "Bloqueado" : pending ? "..." : "Guardar"}</button>
      {state?.error ? <small className="error">{state.error}</small> : null}
      {state?.ok ? <small className="ok">{state.ok}</small> : null}
    </form>
  );
}
