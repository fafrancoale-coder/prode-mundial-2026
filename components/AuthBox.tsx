"use client";

import { useActionState } from "react";
import { loginOrRegister } from "@/app/actions";

export function AuthBox() {
  const [state, action, pending] = useActionState(loginOrRegister, null);

  return (
    <form action={action} className="panel auth-box">
      <div>
        <p className="eyebrow">Entrar al prode</p>
        <h2>Usá un nombre simple</h2>
      </div>
      <label>
        Usuario
        <input name="username" placeholder="ej: franco" autoComplete="username" required />
      </label>
      <label>
        Contraseña opcional
        <input name="password" type="password" placeholder="Recomendada si compartís el link" />
      </label>
      {state?.error ? <p className="message error">{state.error}</p> : null}
      <button className="primary" disabled={pending}>
        {pending ? "Entrando..." : "Entrar o registrarme"}
      </button>
    </form>
  );
}
