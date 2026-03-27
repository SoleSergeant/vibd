import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

export function StatsCard({
  title,
  value,
  description
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
