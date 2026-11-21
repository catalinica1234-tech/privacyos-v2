"use client";

import { useRef, useState, type FormEvent } from "react";
import { Alert, SectionHead } from "@/components/ui";
import { quoteSchema, segments } from "@/lib/quotes";

export function Quotes() {
  const [segment, setSegment] = useState<typeof segments[number]["id"]>("personal");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});
  const pending = useRef(false);
  const attempt = useRef<{ id: string; content: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const requiresOrganization = segment === "business" || segment === "institucional";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    setError("");
    setFields({});
    const data = new FormData(event.currentTarget);
    const payload = {
      segment, name: data.get("name"), email: data.get("email"),
      organization: requiresOrganization ? data.get("organization") : undefined,
      sites: data.get("sites"), need: data.get("need"),
      consent: data.get("consent") === "on", website: data.get("website"),
    };
    const content = JSON.stringify(payload);
    if (attempt.current?.content !== content) attempt.current = { id: crypto.randomUUID(), content };
    const parsed = quoteSchema.safeParse({ ...payload, requestId: attempt.current.id });
    if (!parsed.success) {
      setFields(parsed.error.flatten().fieldErrors);
      setError("Revisa los campos indicados.");
      return;
    }

    pending.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setFields(result.fields ?? {});
        setError(result.message ?? "No se pudo confirmar la recepción. Inténtalo nuevamente.");
        return;
      }
      setSent(true);
      form.current?.reset();
    } catch {
      setError("No se pudo confirmar la recepción. Reintenta con los mismos datos para evitar duplicados.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const fieldError = (name: string) => fields[name]?.length
    ? <p className="mt-1 text-[12px] text-muted" id={"quote-error-" + name}>{fields[name][0]}</p>
    : null;

  return (
    <section id="cotizacion" className="border-t border-line-soft py-20">
      <div className="container mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="Planes referenciales" title="Una propuesta según lo que necesitas revisar"
          text="Compara el alcance de una revisión personal, profesional, empresarial o institucional. La disponibilidad y el presupuesto se acuerdan en una cotización personalizada." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((item) => (
            <article className="card p-6" key={item.id}>
              <h3 className="font-disp text-lg font-semibold">{item.label}</h3>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">{item.detail}</p>
              <a href="#solicitud" className="btn btn-ghost btn-sm mt-4"
                onClick={() => { setSegment(item.id); setSent(false); }}>Solicitar propuesta</a>
            </article>
          ))}
        </div>
        <div className="card mt-10 p-6" id="solicitud">
          <h3 className="font-disp text-lg font-semibold">Solicitar cotización</h3>
          {sent ? (
            <div className="mt-4" role="status">
              <Alert kind="success" title="Solicitud registrada">Tus datos se guardaron para que el equipo revise tu consulta.</Alert>
              <button className="btn btn-ghost btn-sm mt-4" onClick={() => { attempt.current = null; setSent(false); }}>Nueva solicitud</button>
            </div>
          ) : (
            <form ref={form} onSubmit={submit} className="mt-4 grid gap-4">
              <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="quote-segment">Tipo de cliente</label>
                  <select id="quote-segment" className="select" value={segment} onChange={e => {
                    const selected = segments.find(item => item.id === e.target.value);
                    if (selected) setSegment(selected.id);
                  }}>{segments.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
                <div><label className="label" htmlFor="quote-sites">Cantidad de sitios</label>
                  <select id="quote-sites" name="sites" className="select">
                    {["1", "2-5", "6-20", "21+"].map(value => <option key={value}>{value}</option>)}
                  </select></div>
                <div><label className="label" htmlFor="quote-name">Nombre</label>
                  <input id="quote-name" name="name" className="input" autoComplete="name" required minLength={2} maxLength={100}
                    aria-invalid={Boolean(fields.name)} aria-describedby={fields.name ? "quote-error-name" : undefined} />{fieldError("name")}</div>
                <div><label className="label" htmlFor="quote-email">Correo</label>
                  <input id="quote-email" name="email" className="input" type="email" autoComplete="email" required maxLength={254}
                    aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? "quote-error-email" : undefined} />{fieldError("email")}</div>
                {requiresOrganization ? <div className="sm:col-span-2">
                  <label className="label" htmlFor="quote-organization">Organización</label>
                  <input id="quote-organization" name="organization" className="input" autoComplete="organization" required maxLength={140}
                    aria-invalid={Boolean(fields.organization)} aria-describedby={fields.organization ? "quote-error-organization" : undefined} />{fieldError("organization")}
                </div> : null}
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="quote-need">Necesidad principal</label>
                  <textarea id="quote-need" name="need" className="input" rows={3} required minLength={10} maxLength={800}
                    aria-invalid={Boolean(fields.need)} aria-describedby={fields.need ? "quote-error-need" : undefined} />{fieldError("need")}
                </div>
                <div hidden><input name="website" tabIndex={-1} autoComplete="off" /></div>
                <label className="flex items-start gap-2 text-[13px] text-muted sm:col-span-2">
                  <input name="consent" type="checkbox" className="mt-1" required />
                  <span>Autorizo usar estos datos para gestionar y responder mi solicitud. Se guardarán en el servidor. Evita incluir credenciales o información sensible.</span>
                </label>
              </fieldset>
              <details className="rounded-xl border border-line p-3 text-[13px] text-muted">
                <summary className="cursor-pointer font-medium text-ink">Uso de tus datos</summary>
                <p className="mt-2 leading-6">El equipo usa estos datos para revisar el alcance de la solicitud y ponerse en contacto contigo. La solicitud se guarda en una tabla separada de los informes y no se envía al asistente.</p>
                <p className="mt-2 leading-6">Puedes solicitar acceso, corrección o eliminación a través del contacto indicado en el pie de página.</p>
              </details>
              {error ? <div role="alert"><Alert kind="danger">{error}</Alert></div> : null}
              <div role="status"><button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Enviando solicitud…" : "Enviar solicitud"}
              </button></div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
