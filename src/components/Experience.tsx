"use client";

import { LayoutGroup } from "motion/react";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { Moment } from "@/lib/types";
import { Album } from "./Album";
import { Lightbox } from "./Lightbox";
import { River } from "./River";

/** Telas largas ou celular deitado mostram o Rio da vida; o resto mostra o Álbum. */
const WIDE_QUERY = "(min-width: 900px), (orientation: landscape) and (max-height: 520px)";

type Mode = "rio" | "album";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMode(): Mode {
  const forced = new URLSearchParams(window.location.search).get("modo");
  if (forced === "rio" || forced === "album") return forced;
  return window.matchMedia(WIDE_QUERY).matches ? "rio" : "album";
}

export function Experience({ moments }: { moments: Moment[] }) {
  const mode = useSyncExternalStore<Mode | null>(subscribe, getMode, () => null);
  const [openId, setOpenId] = useState<string | null>(null);
  const sorted = useMemo(() => [...moments].sort((a, b) => a.date.localeCompare(b.date)), [moments]);

  if (!mode) return <div className="splash" aria-hidden />;

  return (
    <LayoutGroup>
      {mode === "rio" ? (
        <River moments={sorted} onOpen={setOpenId} paused={!!openId} />
      ) : (
        <Album moments={sorted} onOpen={setOpenId} />
      )}
      <Lightbox moments={sorted} openId={openId} onChange={setOpenId} />
    </LayoutGroup>
  );
}
