import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "./ui/field"
import { Input } from "./ui/input"
import { useClient } from "@/provider/clientProvider"
import { useSettings } from "@/provider/settingsProvider"
import { toast } from "sonner"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import { useTranslation } from "@/hooks/useTranslation"

export function LoginForm({
    className,
    ...props
}: HTMLMotionProps<"div">) {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [isLogin, setIsLogin] = useState(true)

    const client = useClient();
    const { settings } = useSettings();
    const { t } = useTranslation();

    // Map defaultView setting to route
    const getDefaultRoute = () => {
        switch (settings.defaultView) {
            case 'valutazioni':
                return '/valutazioni';
            case 'exercises':
                return '/exercises';
            case 'dashboard':
            default:
                return '/welcome';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            let response;

            if (isLogin) {
                response = await client.login(email, password)
            } else {
                response = await client.register(email, password, firstName, lastName)
            }

            if (response.error) {
                return toast.error(response.error.message || t("auth.invalidCredentials"))
            }

            if (response.success) {
                toast.success(isLogin ? t("auth.loginSuccess") : t("auth.registerSuccess"))
                navigate(getDefaultRoute())
            }
        } catch (error) {
            console.error("Login failed:", error)
            toast.error(t("common.error"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialLogin = () => {
        navigate(getDefaultRoute())
    }

    return (
        <motion.div 
            layout
            className={cn("flex flex-col gap-6", className)} 
            {...props}
        >
            <Card className="overflow-hidden shadow-xl border-muted-foreground/15">
                <motion.div layout="position">
                    <CardHeader className="text-center pb-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "login-header" : "register-header"}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CardTitle className="text-2xl font-bold tracking-tight">
                                    {isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}
                                </CardTitle>
                                <CardDescription className="mt-1.5">
                                    {isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
                                </CardDescription>
                            </motion.div>
                        </AnimatePresence>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <FieldGroup>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Field>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => handleSocialLogin()}
                                            disabled={true}
                                            className="w-full relative overflow-hidden transition-all duration-300 hover:bg-muted/80 active:scale-98"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
                                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                            </svg>
                                            {isLogin ? `${t("auth.signInBtn")} with Google` : `${t("auth.signUpBtn")} with Google`}
                                        </Button>
                                    </Field>
                                </motion.div>
                                
                                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                    {t("common.options")}
                                </FieldSeparator>

                                <AnimatePresence initial={false} mode="popLayout">
                                    {!isLogin && (
                                        <motion.div
                                            key="register-fields"
                                            initial={{ opacity: 0, height: 0, y: -15 }}
                                            animate={{ opacity: 1, height: "auto", y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: -15 }}
                                            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-4 pb-2">
                                                <Field>
                                                    <FieldLabel htmlFor="firstName">{t("auth.firstName")}</FieldLabel>
                                                    <Input
                                                        id="firstName"
                                                        type="text"
                                                        placeholder="John"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                        className="focus:border-primary/50 transition-colors"
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldLabel htmlFor="lastName">{t("auth.lastName")}</FieldLabel>
                                                    <Input
                                                        id="lastName"
                                                        type="text"
                                                        placeholder="Doe"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                        className="focus:border-primary/50 transition-colors"
                                                    />
                                                </Field>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.div layout="position" className="space-y-4">
                                    <Field>
                                        <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="focus:border-primary/50 transition-colors"
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="focus:border-primary/50 transition-colors"
                                        />
                                    </Field>
                                    <Field className="pt-2">
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="w-full relative overflow-hidden transition-all duration-300 hover:shadow-md active:scale-98"
                                        >
                                            {isLoading 
                                                ? (isLogin ? t("auth.signingIn") : t("auth.registering")) 
                                                : (isLogin ? t("auth.signInBtn") : t("auth.signUpBtn"))}
                                        </Button>
                                        <FieldDescription className="text-center mt-3">
                                            {isLogin ? t("auth.dontHaveAccount") : t("auth.alreadyHaveAccount")}{" "}
                                            <a 
                                                className="cursor-pointer font-semibold text-primary hover:underline ml-1" 
                                                onClick={() => setIsLogin(!isLogin)}
                                            >
                                                {isLogin ? t("auth.signUpBtn") : t("auth.signInBtn")}
                                            </a>
                                        </FieldDescription>
                                    </Field>
                                </motion.div>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </motion.div>
            </Card>
            <FieldDescription className="px-6 text-center text-xs">
                SportsGradeHub &copy; {new Date().getFullYear()} &bull; <Link className="text-primary hover:underline" to="/terms">{t("settings.about.terms")}</Link> &bull; <Link className="text-primary hover:underline" to="/privacy">{t("settings.about.privacy")}</Link>
            </FieldDescription>
        </motion.div>
    )
}
