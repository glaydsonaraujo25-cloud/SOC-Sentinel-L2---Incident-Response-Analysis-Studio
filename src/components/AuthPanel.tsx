import React, { useState } from "react";
import { LogIn, LogOut, UserPlus, Database, CloudOff } from "lucide-react";
import { isSupabaseConfigured, supabase, type User } from "../lib/supabase";

interface Props {
  user: User | null;
  onAuthChanged: () => void;
}

export const AuthPanel: React.FC<Props> = ({ user, onAuthChanged }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (mode: "login" | "signup") => {
    if (!supabase || !email.trim() || password.length < 6) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
      if (result.error) throw result.error;
      setMessage(mode === "signup" ? "Cadastro enviado. Verifique seu e-mail se a confirmação estiver habilitada." : "Login realizado.");
      onAuthChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na autenticação.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    onAuthChanged();
  };

  if (!isSupabaseConfigured) {
    return <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
      <CloudOff className="w-5 h-5 text-slate-500" />
      <div><p className="text-xs font-semibold text-slate-300">Modo local ativo</p><p className="text-[10px] text-slate-500">Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para ativar login e sincronização.</p></div>
    </div>;
  }

  if (user) {
    return <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Database className="w-5 h-5 text-emerald-400"/><div><p className="text-xs font-semibold text-slate-200">Sincronização em nuvem ativa</p><p className="text-[10px] font-mono text-slate-500">{user.email}</p></div></div>
      <button onClick={logout} className="px-3 py-2 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 hover:border-red-800 hover:text-red-300"><LogOut className="w-4 h-4"/>Sair</button>
    </div>;
  }

  return <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-2"><Database className="w-4 h-4 text-cyan-400"/><div><p className="text-xs font-semibold text-slate-200">Conta do analista</p><p className="text-[10px] text-slate-500">Entre para sincronizar seus incidentes entre dispositivos.</p></div></div>
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
      <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="E-mail" className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-600"/>
      <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Senha (mín. 6 caracteres)" className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-600"/>
      <button disabled={busy || !email.trim() || password.length < 6} onClick={()=>run("login")} className="px-3 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"><LogIn className="w-4 h-4"/>Entrar</button>
      <button disabled={busy || !email.trim() || password.length < 6} onClick={()=>run("signup")} className="px-3 py-2 border border-slate-700 hover:border-cyan-700 disabled:opacity-40 rounded-lg text-xs flex items-center justify-center gap-1"><UserPlus className="w-4 h-4"/>Cadastrar</button>
    </div>
    {message && <p className="text-[10px] text-slate-400">{message}</p>}
  </div>;
};
