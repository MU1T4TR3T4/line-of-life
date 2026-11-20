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

interface Props {
  moments: Moment[];
  source?: "drive" | "exemplo";
  error?: string;
}

export function Experience({ moments, source = "exemplo", error }: Props) {
  const mode = useSyncExternalStore<Mode | null>(subscribe, getMode, () => null);
  const [openId, setOpenId] = useState<string | null>(null);
  const sorted = useMemo(() => [...moments].sort((a, b) => a.date.localeCompare(b.date)), [moments]);

  if (!mode) return <div className="splash" aria-hidden />;

  if (sorted.length === 0) {
    return (
      <main className="empty">
        <div className="empty-card">
          <div className="gate-name">Ainda sem fotos</div>
          {error ? (
            <p>Não consegui ler a pasta do Google Drive. Confira se a pasta foi compartilhada com a conta de serviço. Detalhe: {error}</p>
          ) : (
            <p>A pasta do Google Drive está vazia. Coloque as primeiras fotos e vídeos nela e, em até 15 minutos, eles aparecem aqui.</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <LayoutGroup>
      {mode === "rio" ? (
        <River moments={sorted} onOpen={setOpenId} paused={!!openId} />
      ) : (
        <Album moments={sorted} onOpen={setOpenId} />
      )}
      <Lightbox moments={sorted} openId={openId} onChange={setOpenId} />
      {source === "exemplo" && <div className="sample-badge">fotos de exemplo</div>}
    </LayoutGroup>
  );
}
