import { motion } from "framer-motion";
import { ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export const GlassCard = ({ children, className, onClick }: GlassCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={clsx(
                "glass-panel rounded-xl p-6 transition-all duration-300 hover:bg-white/5",
                className
            )}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
};
