import { useState } from "react";
import { Customer } from "@db/schema";
import { CustomerCard } from "./customer-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CallListProps {
  customers: Customer[];
}

export function CallList({ customers }: CustomerListProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleCustomer = (id: number) => {
    setSelectedCustomers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllCustomers = () => {
    if (!customers || customers.length === 0) return;

    const allSelected = customers.every(customer => selectedCustomers[customer.id]);
    if (allSelected) {
      setSelectedCustomers({});
    } else {
      const newSelected = customers.reduce((acc, customer) => {
        acc[customer.id] = true;
        return acc;
      }, {} as Record<number, boolean>);
      setSelectedCustomers(newSelected);
    }
  };

  const deleteSelectedCustomers = async () => {
    const selectedIds = Object.entries(selectedCustomers)
      .filter(([_, selected]) => selected)
      .map(([id]) => parseInt(id));

    if (selectedIds.length === 0) {
      toast({
        title: "Keine Kunden ausgewählt",
        description: "Bitte wählen Sie mindestens einen Kunden zum Löschen aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/customers/${id}`, { method: 'DELETE' })
      ));

      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Kunden gelöscht",
        description: `${selectedIds.length} Kunden wurden erfolgreich gelöscht.`,
      });
      setSelectedCustomers({});
    } catch (error) {
      console.error('Error deleting customers:', error);
      toast({
        title: "Fehler beim Löschen",
        description: "Die ausgewählten Kunden konnten nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  if (!Array.isArray(customers)) {
    return <div>Keine Kunden verfügbar.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="selectAll"
            checked={customers.length > 0 && customers.every(customer => selectedCustomers[customer.id])}
            onCheckedChange={toggleAllCustomers}
          />
          <label htmlFor="selectAll" className="text-sm font-medium">
            Alle auswählen
          </label>
        </div>
        <Button
          variant="destructive"
          onClick={deleteSelectedCustomers}
          disabled={Object.keys(selectedCustomers).length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {Object.keys(selectedCustomers).length} Kunden löschen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="relative">
            <div className="absolute top-4 left-4 z-10">
              <Checkbox
                checked={selectedCustomers[customer.id]}
                onCheckedChange={() => toggleCustomer(customer.id)}
              />
            </div>
            <CustomerCard customer={customer} />
          </div>
        ))}
      </div>
    </div>
  );
}