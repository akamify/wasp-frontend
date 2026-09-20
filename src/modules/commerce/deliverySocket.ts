import { useEffect, useRef } from "react";
import { API, getToken } from "@api/api";
type Socket = { on: (event: string, callback: () => void) => void; disconnect: () => void };
type Factory = (url: string, options: unknown) => Socket;
let loading: Promise<Factory> | undefined;
function client(origin: string): Promise<Factory> {
  if (!loading) loading = new Promise<Factory>((resolve, reject) => {
    const script = document.createElement("script"); script.src = `${origin}/socket.io/socket.io.js`; script.async = true;
    script.onload = () => { const io = (window as unknown as { io?: Factory }).io; io ? resolve(io) : reject(new Error("Socket unavailable")); };
    script.onerror = () => reject(new Error("Socket unavailable")); document.head.appendChild(script);
  }).catch((e) => { loading = undefined; throw e; });
  return loading;
}
export function useDeliverySocket(workspaceId: string | null, refresh: () => void) {
  const callback = useRef(refresh); callback.current = refresh;
  useEffect(() => {
    let active = true, socket: Socket | undefined;
    const origin = new URL(String(API.baseUrl), location.origin).origin;
    void client(origin).then((io) => {
      if (!active) return; socket = io(`${origin}/delivery`, { withCredentials: true, auth: (done: (value: unknown) => void) => done({ token: getToken(), ...(workspaceId ? { workspaceId } : {}) }) });
      socket.on("delivery.changed", () => callback.current()); socket.on("connect", () => callback.current());
    }).catch(() => {}); // Bounded authenticated polling remains available when sockets are blocked.
    return () => { active = false; socket?.disconnect(); };
  }, [workspaceId]);
}
