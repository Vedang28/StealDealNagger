import { motion } from "framer-motion";

export default function PageHeader({
  title,
  description,
  label,
  children,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ${className}`}
    >
      <div>
        {label && (
          <span className="font-mono text-[0.7rem] text-[#888] tracking-widest">
            .{label}
          </span>
        )}
        <h1 className="font-serif text-3xl font-normal text-[#f0ede8]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#888] mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </motion.div>
  );
}
