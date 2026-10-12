import { Link } from "react-router-dom";
import { ArrowRight, Gift, Sparkles, RefreshCw } from "lucide-react";
import { promotions as plannedPromotions } from "@/lib/legacyCatalog";
import type { Promotion } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Sparkles,
  RefreshCw,
};

export default function PromotionsPage() {
  const promotions: Promotion[] = plannedPromotions;
  const loading = false;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest text-pink-400 uppercase">
            Rewards
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">
            Bonuses & <span className="text-gradient-pink">Promotions</span>
          </h1>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Explore demo play while welcome offers and weekly rewards are being
            prepared
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {promotions.map((promo, i) => {
              const Icon = iconMap[promo.icon] || Gift;
              return (
                <div
                  key={promo.id}
                  className="group relative rounded-3xl overflow-hidden animate-[count-up_0.5s_ease_backwards]"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${promo.gradient} opacity-90`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                  <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

                  <div className="relative p-8 sm:p-10 flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold tracking-widest text-white">
                          {promo.badge}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-white mb-1">
                        {promo.title}
                      </h2>
                      <p className="text-lg font-semibold text-white/90 mb-3">
                        {promo.subtitle}
                      </p>
                      <p className="text-sm text-white/70 leading-relaxed max-w-xl">
                        {promo.description}
                      </p>

                      <Link
                        to={promo.badge === "DEMO" ? "/games/slots" : "/terms"}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/30 transition-all duration-300 group-hover:gap-3"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bonus info */}
        <div className="mt-16 max-w-4xl mx-auto glass rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-4">
            Bonus Terms & Conditions
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span> No cash bonuses
              are active during preparation.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span> Deposits and
              withdrawals are currently disabled.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span> Demo credits have
              no cash value and reset when you reload.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span> Live offers
              require published eligibility, wagering requirements and expiry
              terms.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span> Please play
              responsibly and set your session limits.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
