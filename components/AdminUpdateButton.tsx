"use client";

import { useActionState } from "react";
import { updateRound } from "@/app/admin/actions";

export function AdminUpdateButton() {
  const [state, action, pending] = useActionState(updateRound, null);

  return (
    <form action={action} className="admin-update">
      <button className="primary" disabled={pending}>
        {pending ? "Actualizando..." : "Actualizar fecha"}
      </button>
      {state?.ok ? <p className="message ok">{state.ok}</p> : null}
      {state?.error ? <p className="message error">{state.error}</p> : null}
    </form>
  );
}
