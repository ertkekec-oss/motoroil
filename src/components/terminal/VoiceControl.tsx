import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function VoiceControl({ onCommand }: { onCommand: (cmd: string) => void }) {
    const isVoiceEnabled = process.env.NEXT_PUBLIC_POS_VOICE !== 'false';
    const [isListening, setIsListening] = useState(false);
    const [supported, setSupported] = useState(true);
    const { showWarning } = useModal();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRec) {
                setSupported(false);
            }
        }
    }, []);

    const toggleListening = useCallback(() => {
        if (!supported) {
            showWarning("Desteklenmiyor", "Tarayıcınız ses tanıma özelliğini desteklemiyor.");
            return;
        }
        if (isListening) {
            setIsListening(false);
            return;
        }

        try {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRec();
            recognition.lang = 'tr-TR';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (e: any) => {
                console.error("Speech reco var: ", e);
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const speechToText = event.results[0][0].transcript;
                onCommand(speechToText.toLowerCase());
            };

            recognition.start();
        } catch (e) {
            console.error("Voice capture config err", e);
            setIsListening(false);
        }
    }, [isListening, supported, onCommand, showWarning]);

    if (!isVoiceEnabled) return null;

    return (
        <button
            onClick={toggleListening}
            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${isListening
                ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
            title="Sesli POS Komutu"
        >
            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
    );
}
