import { GalleryVerticalEnd } from "lucide-react"
import { Navigate } from "react-router-dom"
import { LoginForm } from "../components/login-form"
import { useAuth } from "@/provider/clientProvider"
import LoadingPage from "./Loading";

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
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex items-center gap-2 self-center font-medium">
                    <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    SportsGradeHub
                </a>
                <LoginForm />
            </div>
        </div>
    )
}
