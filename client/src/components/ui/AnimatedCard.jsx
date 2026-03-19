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
          ? { y: -2, boxShadow: "0 8px 25px -5px rgba(0,0,0,0.1)" }
          : undefined
      }
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
