import { useEffect, useState } from "react";
import {
  SlotAudio,
  readSlotAudioPreferences,
  type SlotAudioPreferences,
} from "../lib/slotAudio";
const key = "spindra:slot-audio:v1";
export function useSlotAudio(slug: string) {
  const [audio] = useState(() => new SlotAudio(slug));
  const [preferences, setPreferences] = useState(() => {
    try {
      return readSlotAudioPreferences(window.localStorage.getItem(key));
    } catch {
      return readSlotAudioPreferences(null);
    }
  });
  useEffect(() => {
    audio.configure(preferences);
    try {
      window.localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
      /* Private storage is optional. */
    }
  }, [audio, preferences]);
  useEffect(() => {
    audio.activate();
    const pause = () => audio.pause();
    const resume = () => {
      if (!document.hidden) audio.resume();
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", pause);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", visibility);
      audio.dispose();
    };
  }, [audio]);
  function configure(next: SlotAudioPreferences) {
    audio.configure(next);
    setPreferences(next);
    audio.unlock();
  }
  return { audio, preferences, configure };
}
