import { motion } from "framer-motion";

export default function PageHeader({
  title,
  description,
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
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </motion.div>
  );
}
