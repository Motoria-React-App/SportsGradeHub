
import { Navigate } from "react-router-dom"
import { LoginForm } from "../components/login-form"
import { useAuth } from "@/provider/clientProvider"
import LoadingPage from "./Loading"
import { motion } from "framer-motion"
import { pageTransition, scaleIn } from "@/lib/motion";

export default function LoginPage() {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading while checking session
    {/*Borroni Cacca*/ }
    if (isLoading) {
        return (
            <LoadingPage />
        );
    }

    // Redirect to welcome if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }

    return (
        <motion.div
            className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
        >
            <motion.div
                className="flex w-full max-w-sm flex-col gap-6"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
            >
                <motion.a
                    href="#"
                    className="flex items-center gap-2 self-center font-medium text-xl"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <div className="flex size-8 items-center justify-center rounded-full overflow-hidden shadow-sm">
                        <img src="/logoSGH.png" alt="SportsGradeHub Logo" className="w-full h-full object-cover" />
                    </div>
                    SportsGradeHub
                </motion.a>
                <LoginForm />
            </motion.div>
        </motion.div>
    )
}
