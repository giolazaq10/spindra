import { Link } from "react-router-dom";
import { Gift, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import type { Promotion } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Sparkles,
  RefreshCw,
};

type Props = {
  promotions: Promotion[];
};

export default function Promotions({ promotions }: Props) {
  return (
    <section id="promotions" className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest text-pink-400 uppercase">
            Rewards
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2">
            Bonuses & <span className="text-gradient-pink">Promotions</span>
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Explore original games while welcome offers and weekly rewards are
            being prepared
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {promotions.map((promo, i) => {
            const Icon = iconMap[promo.icon] || Gift;
            return (
              <div
                key={promo.id}
                className="group relative rounded-3xl overflow-hidden animate-[count-up_0.5s_ease_backwards]"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${promo.gradient} opacity-90`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />

                <div className="relative p-8 min-h-[280px] flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    {promo.badge && (
                      <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold tracking-widest text-white">
                        {promo.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-extrabold text-white mb-1">
                    {promo.title}
                  </h3>
                  {promo.subtitle && (
                    <p className="text-lg font-semibold text-white/90 mb-3">
                      {promo.subtitle}
                    </p>
                  )}
                  {promo.description && (
                    <p className="text-sm text-white/70 leading-relaxed flex-1">
                      {promo.description}
                    </p>
                  )}

                  <Link
                    to="/promotions"
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/30 transition-all duration-300 group-hover:gap-3 w-fit"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
