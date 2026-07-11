import { useEffect, useRef } from 'react';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', color = 'red', onConfirm, onCancel }) {
  const styleRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes cm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes cm-scaleIn { from { opacity: 0; transform: scale(0.92) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => style.remove();
  }, []);

  if (!open) return null;

  const iconColors = {
    red: 'from-red-500 to-rose-600',
    indigo: 'from-indigo-500 to-blue-600',
  };

  const btnColors = {
    red: 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-200/50',
    indigo: 'from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-indigo-200/50',
  };

  const icons = {
    red: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    indigo: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'cm-fadeIn 150ms ease-out' }} />

      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden"
        style={{ animation: 'cm-scaleIn 200ms ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full bg-gradient-to-r ${iconColors[color] || iconColors.red}`} />

        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconColors[color] || iconColors.red} flex items-center justify-center shadow-lg`}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[color] || icons.red} />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{title}</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-5 pt-4 flex gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r ${btnColors[color] || btnColors.red} rounded-xl shadow-md hover:shadow-lg active:scale-[0.97] transition-all`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
