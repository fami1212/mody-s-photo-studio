import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { BOOKING_STATUSES, STATUS_LABELS, type BookingStatus } from "@/lib/mody-info";

export const Route = createFileRoute("/_authenticated/admin/reservations")({
  head: () => ({ meta: [{ title: "Réservations — Mody Photography" }, { name: "robots", content: "noindex" }] }),
  component: Reservations,
});

function Reservations() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const { data = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const rows = filter === "all" ? data : data.filter((b) => b.status === filter);

  async function update(id: string, patch: { status?: string; admin_notes?: string }) {
    const { error } = await supabase.from("bookings").update(patch).eq("id", id);
    if (error) toast.error("Mise à jour impossible");
    else {
      toast.success("Enregistré");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    }
  }

  return (
    <main className="mx-auto max-w-[92rem] px-4 py-10 sm:px-5">
      <h1 className="font-display text-4xl uppercase tracking-tight sm:text-6xl">Réservations</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", ...BOOKING_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border-2 border-foreground px-4 py-1.5 text-sm font-bold ${filter === s ? "bg-foreground text-background" : ""}`}
          >
            {s === "all" ? "Toutes" : STATUS_LABELS[s]} ({s === "all" ? data.length : data.filter((b) => b.status === s).length})
          </button>
        ))}
      </div>
      {isLoading && <p className="mt-8 text-muted-foreground">Chargement…</p>}
      {!isLoading && rows.length === 0 && <p className="mt-8 text-muted-foreground">Aucune demande pour le moment.</p>}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {rows.map((b) => (
          <article key={b.id} className="rounded-3xl border-2 border-foreground bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold">{b.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(b.created_at).toLocaleString("fr-FR")} · {b.source === "assistant" ? "Assistant" : "Formulaire"}
                </p>
              </div>
              <select
                value={b.status}
                onChange={(e) => update(b.id, { status: e.target.value })}
                className="rounded-full border-2 border-foreground bg-background px-3 py-1.5 text-sm font-bold"
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <dl className="mt-4 grid gap-1 text-sm">
              <div><dt className="inline font-bold">Téléphone : </dt><dd className="inline">{b.phone}</dd></div>
              {b.offer && <div><dt className="inline font-bold">Formule : </dt><dd className="inline">{b.offer}</dd></div>}
              {b.event_date && <div><dt className="inline font-bold">Date : </dt><dd className="inline">{b.event_date}</dd></div>}
              {b.location && <div><dt className="inline font-bold">Lieu : </dt><dd className="inline">{b.location}</dd></div>}
            </dl>
            {b.message && <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-muted p-3 text-sm">{b.message}</p>}
            <textarea
              defaultValue={b.admin_notes ?? ""}
              maxLength={2000}
              placeholder="Notes internes…"
              onBlur={(e) => e.target.value !== (b.admin_notes ?? "") && update(b.id, { admin_notes: e.target.value })}
              className="mt-3 w-full rounded-2xl border-2 border-foreground bg-background p-3 text-sm"
              rows={2}
            />
            <a
              href={`https://wa.me/${b.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Répondre sur WhatsApp
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
