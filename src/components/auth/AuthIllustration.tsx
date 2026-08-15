import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export function AuthIllustration() {
    return (
        <div className="hidden h-full w-full items-center justify-center lg:flex">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative h-[520px] w-[440px] max-w-full"
            >
                <div className="absolute -left-10 top-12 h-36 w-36 rounded-full bg-emerald-200/30 blur-3xl" />
                <div className="absolute -right-10 bottom-10 h-44 w-44 rounded-full bg-cyan-200/25 blur-3xl" />
                <img
                    src="/Marketing.svg"
                    alt="Marketing illustration"
                    className="relative h-full w-full rounded-[32px] object-cover"
                />
            </motion.div>
        </div>
    );
}
