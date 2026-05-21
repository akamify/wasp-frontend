import { useEffect, useMemo, useState } from "react";

type OtpGuardOptions = {
  cooldownSeconds?: number;
  maxAttempts?: number;
};

export function useOtpGuard(options?: OtpGuardOptions) {
  const cooldownSeconds = Math.max(1, Number(options?.cooldownSeconds || 60));
  const maxAttempts = Math.max(1, Number(options?.maxAttempts || 5));
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const canSend = useMemo(() => cooldown <= 0 && attempts < maxAttempts, [cooldown, attempts, maxAttempts]);
  const remainingAttempts = Math.max(0, maxAttempts - attempts);

  function onSendSuccess() {
    setAttempts((v) => Math.min(maxAttempts, v + 1));
    setCooldown(cooldownSeconds);
  }

  function reset() {
    setAttempts(0);
    setCooldown(0);
  }

  return {
    cooldown,
    attempts,
    remainingAttempts,
    maxAttempts,
    canSend,
    onSendSuccess,
    reset,
  };
}

