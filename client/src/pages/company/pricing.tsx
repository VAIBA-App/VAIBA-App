import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Costs {
  fixed: number;
  variable: number;
  shipping: number;
  fulfillment: number;
}

export default function PricingPage() {
  const [costs, setCosts] = useState<Costs>({
    fixed: 0,
    variable: 0,
    shipping: 0,
    fulfillment: 0
  });
  const [price, setPrice] = useState(0);
  const [profit, setProfit] = useState(0);
  const [totalCosts, setTotalCosts] = useState(0);

  useEffect(() => {
    const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    setTotalCosts(total);
    setProfit(price - total);
  }, [costs, price]);

  const handleCostChange = (field: keyof Costs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCosts(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Preisgestaltung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Kosten</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fixkosten</Label>
                <Input
                  type="number"
                  value={costs.fixed}
                  onChange={(e) => handleCostChange('fixed', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Variable Kosten</Label>
                <Input
                  type="number"
                  value={costs.variable}
                  onChange={(e) => handleCostChange('variable', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Versandkosten</Label>
                <Input
                  type="number"
                  value={costs.shipping}
                  onChange={(e) => handleCostChange('shipping', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Fulfillment</Label>
                <Input
                  type="number"
                  value={costs.fulfillment}
                  onChange={(e) => handleCostChange('fulfillment', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Gesamtkosten:</span>
              <span>{totalCosts.toFixed(2)} €</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div>
              <Label>Verkaufspreis</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Gewinn:</span>
              <span className={cn(
                "font-bold",
                profit > 0 ? "text-green-600" : "text-red-600"
              )}>
                {profit.toFixed(2)} €
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}