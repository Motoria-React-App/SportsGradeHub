import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Users, ClipboardPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSchoolData } from "@/provider/clientProvider";
import { motion } from "framer-motion";
import { scaleIn, buttonPress, staggerContainer, staggerItem } from "@/lib/motion";

interface QuickActionsPanelProps {
    selectedClassId: string;
}

export function QuickActionsPanel({ selectedClassId }: QuickActionsPanelProps) {
    const { classes } = useSchoolData();
    const navigate = useNavigate();

    const selectedClass = classes.find(c => c.id === selectedClassId);

    const handleLinkExercise = () => {
        if (selectedClassId) {
            navigate(`/classes/${selectedClassId}?openLinkExercises=true`);
        } else {
            navigate("/students");
        }
    };

    return (
        <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
        >
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Azioni Rapide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <motion.div
                        className="space-y-3"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={staggerItem}>
                            <motion.div {...buttonPress}>
                                <Button
                                    asChild
                                    className="w-full h-12 text-base font-medium"
                                    size="lg"
                                >
                                    <Link to={selectedClassId ? `/valutazioni/${selectedClassId}/all` : "/valutazioni/all/all"}>
                                        <motion.div
                                            className="mr-2"
                                            whileHover={{ rotate: -10 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <ClipboardCheck className="h-5 w-5" />
                                        </motion.div>
                                        Avvia Valutazione
                                    </Link>
                                </Button>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-2 gap-2"
                            variants={staggerItem}
                        >
                            <motion.div {...buttonPress}>
                                <Button
                                    asChild
                                    variant="secondary"
                                    className="h-14 flex-col gap-1"
                                >
                                    <Link to={selectedClassId ? `/classes/${selectedClassId}` : "/students"}>
                                        <motion.div
                                            whileHover={{ y: -2 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <Users className="h-5 w-5" />
                                        </motion.div>
                                        <span className="text-xs">Studenti</span>
                                    </Link>
                                </Button>
                            </motion.div>
                            <motion.div {...buttonPress}>
                                <Button
                                    variant="secondary"
                                    className="h-14 flex-col gap-1"
                                    onClick={handleLinkExercise}
                                >
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <ClipboardPlus className="h-5 w-5" />
                                    </motion.div>
                                    <span className="text-xs">Collega Esercizio</span>
                                </Button>
                            </motion.div>
                        </motion.div>

                        {selectedClass && (
                            <motion.div
                                className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10"
                                variants={staggerItem}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <p className="text-xs text-muted-foreground">Classe selezionata</p>
                                <motion.p
                                    className="font-medium text-primary"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {selectedClass.className}
                                </motion.p>
                                <motion.p
                                    className="text-xs text-muted-foreground"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {selectedClass.students.length} studenti
                                </motion.p>
                            </motion.div>
                        )}
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
