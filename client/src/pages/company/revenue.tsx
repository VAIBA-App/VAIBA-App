import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Beispieldaten für die Umsatzentwicklung
const revenueData = [
  { month: '01/2024', revenue: 12500 },
  { month: '02/2024', revenue: 15000 },
  { month: '03/2024', revenue: 18500 },
];

export default function RevenuePage() {
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Umsatzentwicklung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `${value.toLocaleString()} €`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
