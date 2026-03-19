import { motion } from "framer-motion";

export default function AnimatedCard({
  children,
  index = 0,
  className = "",
  hover = true,
  onClick,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      whileHover={
        hover
          ? { y: -2, borderColor: "rgba(255,255,255,0.15)" }
          : undefined
      }
      onClick={onClick}
      className={`bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
