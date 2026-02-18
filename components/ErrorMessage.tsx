interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message = "Ocurrió un error. Intenta de nuevo.",
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4 px-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md w-full text-center">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="text-red-700 font-medium mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-navy text-cream font-medium rounded-lg hover:bg-opacity-90 transition-colors text-sm"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
