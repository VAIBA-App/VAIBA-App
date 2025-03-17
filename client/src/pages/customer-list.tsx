import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { CallList } from "@/components/customers/call-list";

export default function CallListPage() {
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: customerApi.getAll,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold mb-8">Anrufliste</h1>

      {isLoading ? (
        <div>Lade Anrufliste...</div>
      ) : error ? (
        <div className="text-red-500">
          Fehler beim Laden der Anrufliste: {(error as Error).message}
        </div>
      ) : !customers ? (
        <div>Keine Kunden gefunden.</div>
      ) : (
        <CallList customers={customers} />
      )}
    </div>
  );
}