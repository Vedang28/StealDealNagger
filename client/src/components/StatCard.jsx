import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Mini sparkline rendered as inline SVG.
 * `data` is an array of numbers; the line auto-scales to fit.
 */
function Sparkline({ data = [], color = "#e8a87c", width = 80, height = 28 }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Animated count-up for numeric values.
 * Extracts the leading number from the value string and animates it.
 */
function AnimatedValue({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const str = String(value);
    // Try to extract a leading number (supports $ prefix, %, K/M suffix)
    const match = str.match(/^(\$?\s*)([\d,.]+)(.*)$/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const prefix = match[1];
    const target = parseFloat(match[2].replace(/,/g, ""));
    const suffix = match[3];

    if (isNaN(target)) {
      setDisplay(value);
      return;
    }

    // Extract previous number
    const prevStr = String(prevRef.current);
    const prevMatch = prevStr.match(/^(\$?\s*)([\d,.]+)(.*)$/);
    const from = prevMatch ? parseFloat(prevMatch[2].replace(/,/g, "")) : 0;
    prevRef.current = value;

    if (from === target) {
      setDisplay(value);
      return;
    }

    const duration = 600;
    const start = performance.now();
    let raf;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;

      // Format with same precision as original
      const hasDecimals = match[2].includes(".");
      const formatted = hasDecimals
        ? current.toFixed(1)
        : Math.round(current).toLocaleString();

      setDisplay(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "primary",
  trend,
  trendLabel,
  sparkData,
  pulse,
}) {
  const colors = {
    primary: "bg-[#e8a87c]/10 text-[#e8a87c]",
    success: "bg-[#4ade80]/10 text-[#4ade80]",
    warning: "bg-[#f59e0b]/10 text-[#f59e0b]",
    danger: "bg-[#ef4444]/10 text-[#ef4444]",
  };

  const sparkColors = {
    primary: "#e8a87c",
    success: "#4ade80",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-[#4ade80]"
      : trend === "down"
        ? "text-[#ef4444]"
        : "text-[#555]";

  return (
    <motion.div
      whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.15)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-5 group cursor-default"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]} ${
              pulse ? "animate-pulse" : ""
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555] font-medium">
              {label}
            </p>
            <p className="text-2xl font-bold text-[#f0ede8] leading-tight mt-0.5">
              <AnimatedValue value={value} />
            </p>
          </div>
        </div>
        {sparkData && sparkData.length >= 2 && (
          <Sparkline data={sparkData} color={sparkColors[color] || "#e8a87c"} />
        )}
      </div>
      {(trend || sub) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
          {trend && (
            <span
              className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              {trendLabel}
            </span>
          )}
          {sub && (
            <span className="text-xs text-[#888]">{sub}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
