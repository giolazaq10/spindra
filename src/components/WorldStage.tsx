import type { ReactNode } from "react";
import WorldCharacter from "./WorldCharacter";
import type { WorldEvent } from "../lib/worldDirector";
export default function WorldStage({
  scene,
  event,
  children,
}: {
  scene: string;
  event: WorldEvent;
  children: ReactNode;
}) {
  return (
    <div className="directed-reel-stage">
      <aside className="world-character-stage">
        <WorldCharacter scene={scene} event={event} />
      </aside>
      <div className="world-reel-stage">{children}</div>
    </div>
  );
}
