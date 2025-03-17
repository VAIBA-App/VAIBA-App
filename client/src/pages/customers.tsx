import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CallList } from "@/components/customers/call-list";
import { Sidebar } from "@/components/layout/sidebar";
import { customerApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Customers() {
  const [search, setSearch] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: customerApi.getAll,
  });

  const filteredCustomers = customers?.filter(customer =>
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    customer.phoneNumber.includes(search)
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Kunden</h1>
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kunden suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div>Lade Kunden...</div>
        ) : (
          <CallList customers={filteredCustomers || []} />
        )}
      </main>
    </div>
  );
}