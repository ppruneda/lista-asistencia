export default function LoadingSpinner({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-navy/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-gold rounded-full animate-spin"></div>
      </div>
      <p className="text-navy/60 text-sm">{message}</p>
    </div>
  );
}
