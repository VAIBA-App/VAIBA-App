import { Customer } from "@db/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock } from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const statusColors = {
    positive: "bg-green-500",
    negative: "bg-red-500",
    neutral: "bg-yellow-500",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">
          {customer.firstName} {customer.lastName}
        </CardTitle>
        <Badge 
          variant="outline" 
          className={`${customer.status ? statusColors[customer.status] : 'bg-gray-500'} text-white`}
        >
          {customer.status || 'unknown'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4" />
            <span>{customer.phoneNumber}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              Added {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          {customer.notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{customer.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}