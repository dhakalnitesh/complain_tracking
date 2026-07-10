import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../Context/LanguageContext';

export default function VoiceInput({ onText, disabled = false }) {
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const sr = new SpeechRecognition();
      sr.continuous = false;
      sr.interimResults = true;
      sr.lang = 'ne-NP';

      sr.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        if (event.results[0].isFinal) {
          onText?.(transcript);
          setIsListening(false);
        }
      };

      sr.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        setError(event.error);
        setIsListening(false);
      };

      sr.onend = () => setIsListening(false);

      setRecognition(sr);
    }
  }, [onText]);

  const toggleListening = useCallback(() => {
    if (!recognition) {
      setError('not-supported');
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognition.lang = 'ne-NP';
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  const isSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          isListening
            ? 'bg-red-100 text-red-700 animate-pulse ring-2 ring-red-300'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } disabled:opacity-50`}
        title={t('submit.voice_hint')}
      >
        <svg className={`w-4 h-4 ${isListening ? 'text-red-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
        </svg>
        {isListening ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            {t('submit.submitting')}
          </span>
        ) : t('submit.voice_hint')}
      </button>
      {error && (
        <span className="text-xs text-red-500">
          {error === 'not-supported' ? 'Voice not supported on this browser' : error}
        </span>
      )}
    </div>
  );
}
