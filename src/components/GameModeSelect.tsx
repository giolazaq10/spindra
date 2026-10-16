import { X, Coins, Wallet, ShieldCheck } from "lucide-react";
import type { GameMode } from "@/context/Wallet";
import { credits } from "@/context/Demo";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: GameMode) => void;
  practiceBalance: number;
  realBalance: number;
  currency: string;
  gameName: string;
  realEnabled: boolean;
  realReason?: string;
};

export default function GameModeSelect({
  open,
  onClose,
  onSelect,
  practiceBalance,
  realBalance,
  currency,
  gameName,
  realEnabled,
  realReason,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[count-up_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-3xl p-8 max-w-md w-full mx-4 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              Choose Mode
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              {gameName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Practice mode */}
          <button
            onClick={() => onSelect("practice")}
            className="w-full glass rounded-2xl p-5 text-left hover:border-amber-400/40 transition-all duration-200 hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Practice Play</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Free credits · No real money involved
                </p>
                <p className="text-sm text-cyan-400 font-semibold mt-1">
                  Balance: {credits(practiceBalance)}
                </p>
              </div>
            </div>
          </button>

          {/* Real mode */}
          <button
            onClick={() => realEnabled && onSelect("real")}
            disabled={!realEnabled}
            className="w-full glass rounded-2xl p-5 text-left transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: realEnabled ? "rgba(255, 215, 0, 0.3)" : undefined,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  realEnabled
                    ? "bg-gradient-to-br from-amber-400 to-orange-500"
                    : "bg-gray-700"
                }`}
              >
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Real Balance</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Play with deposited funds · {currency}
                </p>
                <p className="text-sm text-amber-400 font-semibold mt-1">
                  Balance: {credits(realBalance)} {currency}
                </p>
                {!realEnabled && (
                  <p className="text-xs text-gray-500 mt-1">
                    {realReason || "Cash play is currently unavailable"}
                  </p>
                )}
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-5 text-xs text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>18+ · Please play responsibly</span>
        </div>
      </div>
    </div>
  );
}
