import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl md:text-5xl font-bold text-navy mb-2">
          Sistema de Asistencia
        </h1>
        <p className="text-xl text-gold font-serif mb-12">
          Sucesiones — Facultad de Derecho, UNAM
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/profesor"
            className="px-8 py-4 bg-navy text-cream rounded-lg text-lg font-bold hover:bg-opacity-90 transition-all"
          >
            Profesor
          </Link>
          <Link
            href="/alumno"
            className="px-8 py-4 bg-gold text-navy rounded-lg text-lg font-bold hover:bg-opacity-90 transition-all"
          >
            Alumno
          </Link>
        </div>
      </div>
    </main>
  );
}
