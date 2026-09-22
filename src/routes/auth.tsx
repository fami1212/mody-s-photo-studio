import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import modyLogo from "@/assets/mody-logo-transparent.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Espace privé — Mody Photography" },
      { name: "description", content: "Connexion à l'espace de gestion des photos et publications de Mody." },
      { property: "og:title", content: "Espace privé — Mody Photography" },
      { property: "og:description", content: "Connexion à l'espace de gestion de Mody." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

/** Grants the single admin seat to the first account created. */
export async function claimAdminSeat(userId: string) {
  await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.user) await claimAdminSeat(data.user.id);
        if (!data.session) {
          toast.success("Compte créé. Vérifiez votre boîte mail pour confirmer.");
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await claimAdminSeat(data.user.id);
      }
      navigate({ to: "/admin", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border-2 border-foreground bg-card p-8">
        <span className="inline-flex rounded-full bg-foreground px-3 py-1.5">
          <img src={modyLogo} alt="Mody Photography" className="h-7 w-auto" />
        </span>
        <h1 className="mt-6 font-display text-3xl uppercase tracking-tight">
          {mode === "signin" ? "Espace privé" : "Créer le compte"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Réservé à Mody : gestion des dossiers photos et des publications.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full">
            {busy ? "Un instant…" : mode === "signin" ? "Se connecter" : "Créer le compte"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 text-sm font-medium underline underline-offset-4"
        >
          {mode === "signin" ? "Première connexion ? Créer le compte" : "J'ai déjà un compte"}
        </button>
      </div>
    </main>
  );
}
