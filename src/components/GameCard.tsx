import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { rtpLabel, type Original } from "@/lib/catalog";
export default function GameCard({
  game,
  index = 0,
}: {
  game: Original;
  index?: number;
}) {
  return (
    <Link
      className="game-card"
      to={"/game/" + game.slug}
      style={
        {
          "--theme": game.color,
          "--accent": game.accent,
          "--delay": index * 0.03 + "s",
        } as CSSProperties
      }
    >
      <div className={"game-art " + game.animation}>
        <span className="art-brand">
          SPINDRA
          <br />
          ORIGINALS
        </span>
        <span className="art-number">{String(index + 1).padStart(2, "0")}</span>
        <div className="art-orbit" />
        <div className="art-orbit orbit-two" />
        <span className="art-emblem">{game.emblem}</span>
        <span className="art-caption">{game.name.toUpperCase()}</span>
        <span className="card-play">
          Play demo <ArrowUpRight size={16} />
        </span>
      </div>
      <div className="game-card-info">
        <h3>{game.name}</h3>
        <span>
          {game.kind === "poker" ? "Video poker" : game.kind} <b>·</b>{" "}
          {rtpLabel(game)}
        </span>
      </div>
    </Link>
  );
}
