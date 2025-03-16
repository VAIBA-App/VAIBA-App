import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { CustomerList } from "@/components/customers/customer-list";

export default function CustomerListPage() {
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: customerApi.getAll,
  });

  if (isLoading) {
    return <div>Lade Kundenliste...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Kundenliste: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Kundenliste</h1>
      <CustomerList customers={customers || []} />
    </div>
  );
}