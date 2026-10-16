import { originals } from "@/lib/catalog";
import { Users, Gamepad2, DollarSign, Zap } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Gamepad2,
  DollarSign,
  Zap,
};

const stats = [
  {
    label: "Original Slots",
    value: String(originals.filter((g) => g.slot).length),
    icon: "Users",
  },
  {
    label: "Games Available",
    value: String(originals.length),
    icon: "Gamepad2",
  },
  { label: "Wallet Currency", value: "USD", icon: "DollarSign" },
  { label: "Crypto Deposits", value: "Live", icon: "Zap" },
];

export default function StatsBar() {
  return (
    <section className="relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = iconMap[stat.icon];
            return (
              <div
                key={stat.label}
                className="glass rounded-2xl p-6 text-center hover:border-amber-400/30 transition-colors duration-300 animate-[count-up_0.4s_ease_backwards]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
