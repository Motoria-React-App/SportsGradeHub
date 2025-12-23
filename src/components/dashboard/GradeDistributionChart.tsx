import { Bar, BarChart, XAxis, CartesianGrid, Cell, LabelList } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { UIGrade } from "@/provider/clientProvider";

interface GradeDistributionProps {
    grades: UIGrade[];
}

const chartConfig = {
    count: {
        label: "Quantità",
    },
    bad: {
        label: "< 6",
        color: "var(--destructive)",
    },
    ok: {
        label: "6 - 7",
        color: "var(--chart-2)",
    },
    good: {
        label: "7 - 8",
        color: "var(--chart-3)",
    },
    great: {
        label: "8 - 9",
        color: "var(--chart-4)",
    },
    excellent: {
        label: "9 - 10",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig;

export function GradeDistributionChart({ grades }: GradeDistributionProps) {
    // Process data: count grades in ranges
    const distribution = [
        { range: "< 6", count: 0, fill: "var(--color-bad)" },
        { range: "6 - 7", count: 0, fill: "var(--color-ok)" },
        { range: "7 - 8", count: 0, fill: "var(--color-good)" },
        { range: "8 - 9", count: 0, fill: "var(--color-great)" },
        { range: "9 - 10", count: 0, fill: "var(--color-excellent)" },
    ];

    grades.forEach(grade => {
        const score = grade.finalGrade;
        if (score < 6) distribution[0].count++;
        else if (score >= 6 && score < 7) distribution[1].count++;
        else if (score >= 7 && score < 8) distribution[2].count++;
        else if (score >= 8 && score < 9) distribution[3].count++;
        else if (score >= 9) distribution[4].count++;
    });

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle>Distribuzione Voti</CardTitle>
                <CardDescription>
                    Panoramica delle valutazioni (Totale: {grades.length})
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart
                        accessibilityLayer
                        data={distribution}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="range"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar
                            dataKey="count"
                            radius={8}
                        >
                            <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
                            {distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
