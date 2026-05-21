import { useEffect, useRef, type RefObject } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";

export function useInboundMessageTone(messages: ChatMessage[], urlPhone: string, loadingChat: boolean, navigate: NavigateFunction) {
  const lastInboundToneByPhoneRef = useRef<Record<string, string>>({});
  const inboundToneBootstrappedRef = useRef<Record<string, true>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);
  const fallbackPingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as any;
    if (!AudioCtx) return;
    audioContextRef.current = new AudioCtx();
    const unlock = () => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume().then(() => { audioUnlockedRef.current = true; }).catch(() => {});
      else audioUnlockedRef.current = true;
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      if (ctx) {
        try { void ctx.close(); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!messages.length || !urlPhone || loadingChat) return;
    const latestInbound = [...messages].reverse().find((m) => m.direction === "inbound");
    if (!latestInbound?._id) return;
    const phoneKey = String(urlPhone || latestInbound.phone || "").trim();
    if (!phoneKey) return;
    const lastHeardId = lastInboundToneByPhoneRef.current[phoneKey] || "";
    if (!inboundToneBootstrappedRef.current[phoneKey]) {
      lastInboundToneByPhoneRef.current[phoneKey] = latestInbound._id;
      inboundToneBootstrappedRef.current[phoneKey] = true;
      return;
    }
    if (lastHeardId === latestInbound._id) return;
    const latestAtMs = new Date(String(latestInbound.createdAt || "")).getTime();
    const isFresh = Number.isFinite(latestAtMs) && Date.now() - latestAtMs <= 2 * 60 * 1000;
    lastInboundToneByPhoneRef.current[phoneKey] = latestInbound._id;
    if (!isFresh) return;
    playInboundToneOnce(audioContextRef, audioUnlockedRef, fallbackPingRef);
    notifyInboundMessage(String(latestInbound?.phone || phoneKey || ""), navigate);
  }, [messages, urlPhone, loadingChat, navigate]);
}

function playInboundToneOnce(audioContextRef: RefObject<AudioContext | null>, audioUnlockedRef: RefObject<boolean>, fallbackPingRef: RefObject<HTMLAudioElement | null>) {
  const ctx = audioContextRef.current;
  if (ctx && (audioUnlockedRef.current || ctx.state === "running")) {
    try {
      const master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      const playBeep = (start: number, frequency: number, peak: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, start);
        osc.connect(gain);
        gain.connect(master);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(peak, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.start(start);
        osc.stop(start + duration + 0.01);
      };
      const nowAt = ctx.currentTime;
      playBeep(nowAt, 980, 0.16, 0.16);
      playBeep(nowAt + 0.19, 1180, 0.13, 0.13);
      return;
    } catch {}
  }
  const fallbackPing = fallbackPingRef.current || (() => {
    const audio = new Audio("data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YVAAAAAAgD8AAIC/AACAPwAAgD8AAIC/AACAPwAAgD8AAIC/AACAPwAAgD8AAIC/AACAPwAAgD8AAIC/");
    audio.preload = "auto";
    audio.volume = 0.6;
    fallbackPingRef.current = audio;
    return audio;
  })();
  try {
    fallbackPing.currentTime = 0;
    void fallbackPing.play().catch(() => {});
    return;
  } catch {}

  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as any;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const nowAt = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, nowAt);
    gain.gain.linearRampToValueAtTime(0.06, nowAt + 0.01);
    gain.gain.linearRampToValueAtTime(0.0001, nowAt + 0.18);
    osc.start(nowAt);
    osc.stop(nowAt + 0.2);
    osc.onended = () => {
      try { ctx.close(); } catch {}
    };
  } catch {}
}

function notifyInboundMessage(phone: string, navigate: NavigateFunction) {
  if (!document.hidden) return;
  if ("vibrate" in navigator) {
    try { navigator.vibrate?.([120, 60, 120]); } catch {}
  }
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const notification = new Notification("New WhatsApp message", { body: `From +${phone}`, tag: `inbound-${phone}` });
    notification.onclick = () => {
      window.focus();
      navigate(`/app/conversations/${phone}`);
    };
  } catch {}
}
