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

export default function PrivacyPage() {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-2xl flex-col gap-6">
                <Link to="/login" className="flex items-center gap-2 self-center font-medium">
                    <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    SportsGradeHub
                </Link>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Privacy Policy</CardTitle>
                        <CardDescription>
                            Last updated: {new Date().toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
                            <p className="text-muted-foreground">
                                We collect information you provide directly to us when you create an account, update your profile, and use the application to grade, assess, and manage students. This includes your name, email address, and the educational data you input onto the platform manually.
                            </p>
                        </section>
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
                            <p className="text-muted-foreground">
                                We use the information we collect to operate, maintain, and provide the features and functionality of SportsGradeHub, to securely authenticate users, to communicate with you, and to continuously improve our service based on usage.
                            </p>
                        </section>
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">3. Data Security</h3>
                            <p className="text-muted-foreground">
                                We implement appropriate technical, organizational, and physical security measures to protect your data. This includes ensuring databases are appropriately secured. However, please remember that no method of transmission over the internet or method of electronic storage is 100% secure.
                            </p>
                        </section>
                        <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">4. Data Usage and Sharing</h3>
                            <p className="text-muted-foreground">
                                We completely respect your privacy. We do not share, sell, rent, or trade your personal information or any of your strictly confidential educational data with third parties for their commercial purposes under any circumstances. While we reserve the right to modify or delete data on our servers if necessary to maintain the application's performance, stability, or security, your data will only be utilized for the direct functioning and improvement of SportsGradeHub.
                            </p>
                        </section>
                         <section className="text-foreground">
                            <h3 className="text-lg font-semibold mb-2">5. Your Controls and Choices</h3>
                            <p className="text-muted-foreground">
                                You hold total control over the data present within your account. You can delete or amend records within the platform at any time, or request full deletion of your account and all associated data records.
                            </p>
                        </section>
                        <div className="mt-6 flex justify-center pt-6 border-t">
                            <Button asChild variant="outline">
                                <Link to="/login">Return to Login</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
