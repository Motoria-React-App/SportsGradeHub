import { GalleryVerticalEnd } from "lucide-react"
import { Link } from "react-router-dom"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { pageTransition, slideUp, scaleIn } from "@/lib/motion"

export default function TermsPage() {
    return (
        <motion.div
            className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
        >
            <motion.div
                className="flex w-full max-w-2xl flex-col gap-6"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    variants={slideUp}
                >
                    <Link to="/login" className="flex items-center gap-2 self-center font-medium">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        SportsGradeHub
                    </Link>
                </motion.div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Terms of Service</CardTitle>
                        <CardDescription>
                            Last updated: {new Date().toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h3>
                            <p className="text-muted-foreground">
                                By accessing and using SportsGradeHub, you accept and agree to be bound by the terms and provision of this agreement. Use of the application is strictly for educational and management purposes as intended by the platform.
                            </p>
                        </section>
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">2. Use License</h3>
                            <p className="text-muted-foreground">
                                Permission is granted to temporarily use SportsGradeHub for personal, educational, non-commercial viewing and data management strictly in accordance with these Terms. This is the grant of a license, not a transfer of title.
                            </p>
                        </section>
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">3. User Data and Administration</h3>
                            <p className="text-muted-foreground">
                                You retain all rights to the data you input into SportsGradeHub, including student grades and evaluations. You are fully responsible for ensuring compliance with any applicable educational and privacy regulations (like GDPR) concerning the inputted data. We reserve the right to modify or delete data present on our servers if deemed necessary for the operation, maintenance, or security of the platform, or to comply with legal obligations. However, your data will never be sold or used in ways inappropriate to the core functioning of the application.
                            </p>
                        </section>
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">4. Disclaimer</h3>
                            <p className="text-muted-foreground">
                                The materials on SportsGradeHub are provided on an 'as is' basis. SportsGradeHub makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                            </p>
                        </section>
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">5. Limitations</h3>
                            <p className="text-muted-foreground">
                                In no event shall SportsGradeHub or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the application.
                            </p>
                        </section>
                        <div className="mt-6 flex justify-center pt-6 border-t">
                            <Button asChild variant="outline">
                                <Link to="/login">Return to Login</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
