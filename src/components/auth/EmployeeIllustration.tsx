import { motion } from "framer-motion";

export function EmployeeIllustration() {
    return (
        <div className="hidden h-full w-full items-center justify-center lg:flex">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative h-[520px] w-[440px] max-w-full"
            >
                <img
                    src="/employ.svg"
                    alt="Employee login illustration"
                    className="relative h-full w-full object-cover"
                />
            </motion.div>
        </div>
    );
}
