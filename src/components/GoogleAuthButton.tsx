"use client";

import React, { useState } from "react";
import type { AuthUser } from "@/lib/auth";
import { LogOut, X } from "lucide-react";

interface GoogleAuthButtonProps {
  user: AuthUser | null;
  googleConfigured: boolean;
  onLogout: () => Promise<void>;
  compact?: boolean;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.3V6.6H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.4l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.6l4 3.1c.94-2.84 3.59-4.95 6.71-4.95Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  user,
  googleConfigured,
  onLogout,
  compact = false,
}: GoogleAuthButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  if (user) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-2 p-1 sm:pr-2.5 rounded-full border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 hover:bg-paper-200/70 dark:hover:bg-blueprint-800 transition"
          title={`${user.name} (${user.email})`}
        >
          {user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="w-7 h-7 rounded-full bg-ph text-white font-mono text-xs font-extrabold flex items-center justify-center">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          {!compact && (
            <span className="hidden md:inline text-xs font-bold text-ink-900 dark:text-white max-w-[120px] truncate">
              {user.name.split(" ")[0]}
            </span>
          )}
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3 shadow-xl z-50 space-y-2.5">
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-ink-900 dark:text-white truncate">
                {user.name}
              </div>
              <div className="text-[11px] text-ink-500 dark:text-slate-400 truncate">
                {user.email}
              </div>
              <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                Conectado com Google · Progresso salvo
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await onLogout();
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-paper-300 dark:border-blueprint-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold text-pv dark:text-red-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair da conta
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        data-google-auth-btn
        onClick={() => {
          if (googleConfigured) {
            window.location.href = "/api/auth/google";
          } else {
            setSetupOpen((v) => !v);
          }
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-paper-300 dark:border-blueprint-700 bg-white dark:bg-blueprint-900 hover:bg-paper-100 dark:hover:bg-blueprint-800 text-xs font-bold text-ink-900 dark:text-white shadow-xs transition whitespace-nowrap shrink-0"
      >
        <GoogleMark />
        {compact ? (
          <span className="hidden sm:inline">Entrar com Google</span>
        ) : (
          <>
            <span className="sm:hidden">Entrar</span>
            <span className="hidden sm:inline">Entrar com Google</span>
          </>
        )}
      </button>

      {setupOpen && !googleConfigured && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 shadow-2xl z-50 space-y-2.5 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-extrabold text-ink-900 dark:text-white">
              Ativar Login com Google (OAuth 2.0)
            </div>
            <button
              type="button"
              onClick={() => setSetupOpen(false)}
              className="p-1 rounded-lg hover:bg-paper-200 dark:hover:bg-blueprint-800 text-ink-500"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-ink-600 dark:text-slate-300 leading-relaxed">
            As rotas OAuth 2.0 já estão prontas no servidor! Para ativar o login real, adicione no painel da Vercel (ou <code className="font-mono">.env.local</code>):
          </p>
          <div className="p-2.5 rounded-xl bg-paper-100 dark:bg-blueprint-950 border border-paper-200 dark:border-blueprint-800 font-mono text-[10px] space-y-1 text-ink-800 dark:text-sky-200">
            <div>GOOGLE_CLIENT_ID=...</div>
            <div>GOOGLE_CLIENT_SECRET=...</div>
            <div>AUTH_SECRET=...</div>
          </div>
          <p className="text-[10.5px] text-ink-500 dark:text-slate-400 leading-snug">
            Callback autorizado no Google Cloud Console:{" "}
            <code className="font-mono break-all text-ph dark:text-sky-400">
              {typeof window !== "undefined"
                ? `${window.location.origin}/api/auth/google/callback`
                : "https://epura-lab-gd.vercel.app/api/auth/google/callback"}
            </code>
          </p>
          <p className="text-[10.5px] text-emerald-700 dark:text-emerald-300 font-semibold">
            Enquanto isso, seu progresso em GD e Cálculo 1 continua salvo automaticamente neste navegador!
          </p>
        </div>
      )}
    </div>
  );
}
