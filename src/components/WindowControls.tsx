import { useEffect, useState } from 'react';

export default function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI.isWindowMaximized().then(setIsMaximized);
    const unsubscribe = window.electronAPI.onMaximizedChanged(setIsMaximized);
    return unsubscribe;
  }, []);

  const baseBtn =
    'no-drag h-full w-11 flex items-center justify-center text-stone-400 transition-colors';

  return (
    <div className="no-drag flex items-stretch h-12 ml-2">
      <button
        type="button"
        onClick={() => window.electronAPI.minimizeWindow()}
        className={`${baseBtn} hover:bg-stone-800 hover:text-stone-100`}
        aria-label="Minimize"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => window.electronAPI.toggleMaximizeWindow()}
        className={`${baseBtn} hover:bg-stone-800 hover:text-stone-100`}
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <rect x="0.5" y="2.5" width="7" height="7" />
            <path d="M2.5 2.5 V0.5 H9.5 V7.5 H7.5" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={() => window.electronAPI.closeWindow()}
        className={`${baseBtn} hover:bg-red-600 hover:text-white`}
        aria-label="Close"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor">
          <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" />
          <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" />
        </svg>
      </button>
    </div>
  );
}
