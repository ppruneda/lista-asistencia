"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface CodigoRotativoProps {
  sessionId: string;
  initialToken: string;
  phase: "entrada" | "salida";
}

export default function CodigoRotativo({ sessionId, initialToken, phase }: CodigoRotativoProps) {
  const [token, setToken] = useState(initialToken);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [rotating, setRotating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rotateToken = useCallback(async () => {
    if (rotating) return;
    setRotating(true);
    try {
      const response = await fetch("/api/session/rotate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json();
      if (data.success) { setToken(data.token); setSecondsLeft(120); }
    } catch (err) { console.error("Error rotating token:", err); }
    finally { setRotating(false); }
  }, [sessionId, rotating]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      rotateTimeoutRef.current = setTimeout(() => { rotateToken(); }, 500);
    }
    return () => { if (rotateTimeoutRef.current) clearTimeout(rotateTimeoutRef.current); };
  }, [secondsLeft, rotateToken]);

  useEffect(() => { setToken(initialToken); setSecondsLeft(120); }, [initialToken]);

  const getTimerColor = () => {
    if (secondsLeft > 30) return "#22c55e";
    if (secondsLeft > 10) return "#eab308";
    return "#ef4444";
  };

  const progress = secondsLeft / 120;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  // Format as M:SS
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className={`px-6 py-2 rounded-full text-lg font-bold uppercase tracking-wider ${phase === "entrada" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"}`}>
        {phase === "entrada" ? "📥 Entrada" : "📤 Salida"}
      </div>
      <div className="relative">
        <div className="font-mono text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-[0.2em] text-white select-none transition-opacity duration-300" style={{ opacity: rotating ? 0.3 : 1 }}>
          {token.slice(0, 4)}<span className="text-gold">-</span>{token.slice(4)}
        </div>
      </div>
      <div className="flex items-center gap-8 sm:gap-12">
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={token} size={140} level="M" bgColor="#FFFFFF" fgColor="#002147" />
        </div>
        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={getTimerColor()} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-linear" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-mono font-bold" style={{ color: getTimerColor() }}>{timeDisplay}</span>
          </div>
        </div>
      </div>
      <div className="text-center text-white/50 text-sm max-w-md space-y-1">
        <p>1. Abre el sistema en tu celular</p>
        <p>2. Ingresa el código de arriba</p>
        <p>3. Ingresa tu número de cuenta UNAM</p>
      </div>
    </div>
  );
}
