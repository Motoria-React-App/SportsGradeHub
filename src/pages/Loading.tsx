import { motion } from "framer-motion"
import { pageTransition, scaleIn } from "@/lib/motion"

const LoadingPage = () => {

    return (
        <motion.div
            className="flex min-h-svh flex-col items-center justify-center"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
        >
            <motion.div
                className="flex items-center font-bold gap-2 self-center text-7xl"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
            >
                <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    SportsGradeHub
                </motion.span>
            </motion.div>
        </motion.div>
    )
}

export default LoadingPage;
