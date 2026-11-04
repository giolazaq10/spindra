import WorldActor from "./WorldActor";
import MaterialSymbol from "./MaterialSymbol";
import { livingWorld } from "../lib/livingWorlds";
export default function WorldEmblem({ scene }: { scene: string }) {
  return (
    <svg className="world-emblem" viewBox="0 0 100 100" aria-hidden="true">
      <g className="symbol-vector">
        <WorldActor kind={livingWorld(scene).actors[0]} />
      </g>
      <MaterialSymbol scene={scene} cell={0} />
    </svg>
  );
}
