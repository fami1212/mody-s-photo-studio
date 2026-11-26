import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { BOOKING_STATUSES, STATUS_LABELS, type BookingStatus } from "@/lib/mody-info";

export const Route = createFileRoute("/_authenticated/admin/reservations")({
  head: () => ({ meta: [{ title: "Réservations — Mody Photography" }, { name: "robots", content: "noindex" }] }),
  component: Reservations,
});

function reservationWhatsAppHref(booking: Tables<"bookings">) {
  const details = [
    booking.offer ? `Formule souhaitée : ${booking.offer}` : "",
    booking.event_date
      ? `Date et heure souhaitées : ${booking.event_date}${booking.event_time ? ` à ${booking.event_time.slice(0, 5)}` : ""}`
      : "",
    booking.location ? `Lieu : ${booking.location}` : "",
    booking.message ? `Précisions : ${booking.message}` : "",
  ].filter(Boolean);
  const message = [
    `Bonjour ${booking.name},`,
    "Merci pour votre demande de réservation auprès de Mody Photography.",
    ...(details.length ? ["J’ai bien noté votre demande :", ...details] : []),
    "Je reviens vers vous pour confirmer les disponibilités et organiser votre séance.",
    "À bientôt !",
  ].join("\n");

  return `https://wa.me/${booking.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

type BookingEdit = Pick<
  Tables<"bookings">,
  "name" | "phone" | "offer" | "event_date" | "event_time" | "location" | "message"
>;

function Reservations() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<BookingEdit | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const rows = data.filter((booking) => {
    const matchesStatus = filter === "all" || booking.status === filter;
    const matchesSearch =
      !normalizedSearch ||
      booking.name.toLocaleLowerCase("fr").includes(normalizedSearch) ||
      booking.phone.toLocaleLowerCase("fr").includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  async function update(id: string, patch: TablesUpdate<"bookings">) {
    const { error } = await supabase.from("bookings").update(patch).eq("id", id);
    if (error) {
      toast.error(error.code === "23505" ? "Ce créneau est déjà réservé." : "Mise à jour impossible");
      return false;
    }
    toast.success("Enregistré");
    qc.invalidateQueries({ queryKey: ["bookings"] });
    return true;
  }

  function startEditing(booking: Tables<"bookings">) {
    setEditingId(booking.id);
    setEditValues({
      name: booking.name,
      phone: booking.phone,
      offer: booking.offer,
      event_date: booking.event_date,
      event_time: booking.event_time?.slice(0, 5) ?? null,
      location: booking.location,
      message: booking.message,
    });
  }

  async function saveEdit(id: string) {
    if (!editValues) return;
    const saved = await update(id, {
      ...editValues,
      event_time: editValues.event_time || null,
    });
    if (saved) {
      setEditingId(null);
      setEditValues(null);
    }
  }

  async function deleteBooking(id: string) {
    if (!window.confirm("Supprimer définitivement cette réservation ?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    toast.success("Réservation supprimée");
    qc.invalidateQueries({ queryKey: ["bookings"] });
  }

  return (
    <main className="admin-page space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suivi des demandes</p>
          <h1 className="admin-page-title mt-2 font-display uppercase">Réservations</h1>
        </div>
        <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
          {data.filter((booking) => booking.status === "new").length} à traiter
        </span>
      </header>
      <section className="admin-card space-y-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par nom ou téléphone"
          aria-label="Rechercher une réservation par nom ou téléphone"
          className="h-11 w-full sm:max-w-sm"
        />
        <div className="admin-nav-scroll flex gap-2 overflow-x-auto pb-1">
          {(["all", ...BOOKING_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`admin-touch-target shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${filter === s ? "border-foreground bg-foreground text-background" : "border-foreground/15 bg-background hover:bg-muted"}`}
            >
              {s === "all" ? "Toutes" : STATUS_LABELS[s]} ({s === "all" ? data.length : data.filter((b) => b.status === s).length})
            </button>
          ))}
        </div>
      </section>
      {isLoading && <p className="py-4 text-muted-foreground">Chargement des réservations…</p>}
      {!isLoading && rows.length === 0 && (
        <p className="admin-card py-10 text-center text-muted-foreground">
          {normalizedSearch ? "Aucun résultat pour cette recherche." : "Aucune demande pour le moment."}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((b) => (
          <article key={b.id} className="admin-card">
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
                aria-label={`Statut de la réservation de ${b.name}`}
                className="admin-touch-target w-full rounded-xl border border-input bg-background px-3 text-sm font-bold sm:w-auto"
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <dl className="mt-4 grid gap-1 text-sm">
              <div><dt className="inline font-bold">Téléphone : </dt><dd className="inline">{b.phone}</dd></div>
              {b.offer && <div><dt className="inline font-bold">Formule : </dt><dd className="inline">{b.offer}</dd></div>}
              {b.event_date && (
                <div>
                  <dt className="inline font-bold">Date : </dt>
                  <dd className="inline">{b.event_date}{b.event_time ? ` à ${b.event_time.slice(0, 5)}` : " (heure non précisée)"}</dd>
                </div>
              )}
              {b.location && <div><dt className="inline font-bold">Lieu : </dt><dd className="inline">{b.location}</dd></div>}
            </dl>
            {editingId === b.id && editValues ? (
              <form
                className="mt-4 grid gap-3 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveEdit(b.id);
                }}
              >
                <label className="grid gap-1 text-sm font-bold">
                  Nom
                  <input required maxLength={80} value={editValues.name} onChange={(event) => setEditValues({ ...editValues, name: event.target.value })} className="admin-touch-target w-full min-w-0 rounded-xl border border-input bg-background px-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Téléphone
                  <input required maxLength={25} value={editValues.phone} onChange={(event) => setEditValues({ ...editValues, phone: event.target.value })} className="admin-touch-target w-full min-w-0 rounded-xl border border-input bg-background px-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Formule
                  <input maxLength={120} value={editValues.offer ?? ""} onChange={(event) => setEditValues({ ...editValues, offer: event.target.value || null })} className="admin-touch-target w-full min-w-0 rounded-xl border border-input bg-background px-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Lieu
                  <input maxLength={120} value={editValues.location ?? ""} onChange={(event) => setEditValues({ ...editValues, location: event.target.value || null })} className="admin-touch-target w-full min-w-0 rounded-xl border border-input bg-background px-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Date
                  <input type="date" value={editValues.event_date ?? ""} onChange={(event) => setEditValues({ ...editValues, event_date: event.target.value || null })} className="admin-touch-target w-full min-w-0 rounded-xl border border-input bg-background px-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Heure
                  <input type="time" value={editValues.event_time ?? ""} onChange={(event) => setEditValues({ ...editValues, event_time: event.target.value || null })} className="admin-touch-target w-full min-w-0 rounded-xl border border-input bg-background px-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-bold sm:col-span-2">
                  Message du client
                  <textarea maxLength={1000} value={editValues.message ?? ""} onChange={(event) => setEditValues({ ...editValues, message: event.target.value || null })} className="min-h-24 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 font-normal" rows={3} />
                </label>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button type="submit" className="admin-touch-target rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Enregistrer</button>
                  <button type="button" onClick={() => { setEditingId(null); setEditValues(null); }} className="admin-touch-target rounded-xl border border-foreground/20 px-4 py-2 text-sm font-bold">Annuler</button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => startEditing(b)} className="admin-touch-target mt-4 w-full rounded-xl border border-foreground/20 px-4 py-2 text-sm font-bold sm:w-auto">
                Modifier la réservation
              </button>
            )}
            {b.message && editingId !== b.id && <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-muted p-3 text-sm">{b.message}</p>}
            <textarea
              defaultValue={b.admin_notes ?? ""}
              maxLength={2000}
              placeholder="Notes internes…"
              onBlur={(e) => e.target.value !== (b.admin_notes ?? "") && update(b.id, { admin_notes: e.target.value })}
              className="admin-touch-target mt-3 w-full rounded-xl border border-input bg-background p-3 text-sm"
              rows={2}
            />
            <a
              href={reservationWhatsAppHref(b)}
              target="_blank"
              rel="noreferrer noopener"
              className="admin-touch-target mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground sm:w-auto"
            >
              Répondre sur WhatsApp
            </a>
            <button type="button" onClick={() => void deleteBooking(b.id)} className="admin-touch-target mt-3 w-full rounded-xl border border-destructive px-4 py-2 text-sm font-bold text-destructive sm:ml-2 sm:w-auto">
              Supprimer
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
