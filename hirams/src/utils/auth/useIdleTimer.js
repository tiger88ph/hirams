import { useEffect, useRef } from "react";

/**
 * Fires `onIdle` after `timeout` ms of user inactivity.
 *
 * Uses a ref for the callback so the effect never re-runs due to a new
 * function reference — listeners are only re-registered when `timeout` changes.
 */
export const useIdleTimer = (timeout, onIdle) => {
  const timerRef  = useRef(null);
  const onIdleRef = useRef(onIdle);

  // Keep ref current without touching the event-listener effect
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onIdleRef.current(), timeout);
    };

    const EVENTS = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    EVENTS.forEach((e) => document.addEventListener(e, reset));
    reset(); // kick off the first countdown

    return () => {
      EVENTS.forEach((e) => document.removeEventListener(e, reset));
      clearTimeout(timerRef.current);
    };
  }, [timeout]); // only re-register if timeout value changes
};