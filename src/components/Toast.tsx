import { useToastStore } from '../store/toastStore';

export default function Toast() {
  const toasts = useToastStore(s => s.toasts);
  const dismiss = useToastStore(s => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-stone-900 border border-amber-600 text-stone-100 text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 max-w-sm"
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-stone-500 hover:text-stone-200"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
