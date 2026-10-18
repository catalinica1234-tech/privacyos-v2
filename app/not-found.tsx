import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6">
      <div className="card max-w-md p-8 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-disp text-2xl font-semibold">La página que buscas no existe</h1>
        <p className="mt-2 text-sm text-muted">
          Puede que el informe o el análisis que intentabas abrir se haya eliminado del historial local de este navegador.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/app/dashboard" className="btn btn-primary">Ir al panel</Link>
          <Link href="/" className="btn btn-ghost">Landing</Link>
        </div>
      </div>
    </main>
  );
}
