import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { UIGrade } from "@/provider/clientProvider";

interface CategoryPerformanceProps {
    grades: UIGrade[];
}

const chartConfig = {
    average: {
        label: "Media Voto",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

export function CategoryPerformanceChart({ grades }: CategoryPerformanceProps) {
    // Calculate average score per category
    const categoryData: Record<string, { sum: number, count: number }> = {};

    grades.forEach(g => {
        if (!categoryData[g.exerciseType]) {
            categoryData[g.exerciseType] = { sum: 0, count: 0 };
        }
        categoryData[g.exerciseType].sum += g.finalGrade;
        categoryData[g.exerciseType].count += 1;
    });

    const data = Object.keys(categoryData).map(key => ({
        subject: key.charAt(0).toUpperCase() + key.slice(1),
        average: parseFloat((categoryData[key].sum / categoryData[key].count).toFixed(1)),
        count: categoryData[key].count, // Add count to data for tooltip
        fullMark: 10, // Reference for scale
    }));

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle>Performance per Categoria</CardTitle>
                <CardDescription>
                    Punti di forza e aree di miglioramento
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
                    <RadarChart data={data} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                        <defs>
                            <linearGradient id="radar-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" labelKey="subject" />}
                        />
                        <PolarGrid className="fill-muted/10 stroke-muted/30" gridType="circle" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={({ x, y, textAnchor, payload, index: _index }) => {
                                return (
                                    <text
                                        x={x}
                                        y={y}
                                        textAnchor={textAnchor}
                                        dy={4}
                                        className="fill-foreground text-[12px] font-medium capitalize"
                                    >
                                        {payload.value}
                                    </text>
                                );
                            }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 10]}
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            dataKey="average"
                            fill="url(#radar-gradient)"
                            fillOpacity={1}
                            stroke="var(--chart-1)"
                            strokeWidth={3}
                            dot={{
                                r: 5,
                                fill: "var(--chart-1)",
                                fillOpacity: 1,
                                stroke: "var(--background)",
                                strokeWidth: 2
                            }}
                            activeDot={{
                                r: 7,
                                strokeWidth: 2,
                                stroke: "var(--background)",
                            }}
                        />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
