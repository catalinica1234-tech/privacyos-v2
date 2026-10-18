"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6">
      <div className="card max-w-lg p-8 text-center">
        <p className="eyebrow">Error inesperado</p>
        <h1 className="mt-3 font-disp text-2xl font-semibold">Algo falló al renderizar esta vista</h1>
        <p className="mt-2 text-sm text-muted">
          {error.message || "Error desconocido de la aplicación."}
        </p>
        <button onClick={reset} className="btn btn-primary mt-6">Intentar de nuevo</button>
      </div>
    </main>
  );
}
