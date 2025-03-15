import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowDownUp, Download, MapPin, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearch } from "@/context/search-context";

interface SearchForm {
  searchTerm: string;
  location: string;
  radius: string;
}

export default function CustomerSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const {
    searchResults,
    setSearchResults,
    selectedCustomers,
    setSelectedCustomers,
    sortDirection,
    setSortDirection
  } = useSearch();

  const form = useForm<SearchForm>({
    defaultValues: {
      searchTerm: "",
      location: "",
      radius: "50", // Default 50km
    },
  });

  const handleSearch = async (data: SearchForm) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/places/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          radius: parseInt(data.radius) * 1000, // Convert km to meters
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Suche');
      }

      const results = await response.json();
      setSearchResults(results); // Dies wird auch selectedCustomers zurücksetzen

      toast({
        title: "Suche abgeschlossen",
        description: `${results.length} potenzielle Kunden gefunden.`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Fehler bei der Suche",
        description: "Die Suche konnte nicht durchgeführt werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSort = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);

    // Create a new array with all entries
    const sorted = [...searchResults].sort((a, b) => {
      const distanceA = a.distance ?? Infinity;
      const distanceB = b.distance ?? Infinity;

      return newDirection === 'asc'
        ? distanceA - distanceB
        : distanceB - distanceA;
    });

    setSearchResults(sorted);
  };

  const exportToCSV = () => {
    if (searchResults.length === 0) return;

    const headers = ['Name', 'Branche', 'Telefon', 'Email', 'Adresse', 'Website', 'Entfernung (km)'];
    const csvContent = [
      headers.join(','),
      ...searchResults.map(result => [
        `"${result.name}"`,
        `"${result.industry}"`,
        `"${result.phoneNumber}"`,
        `"${result.email}"`,
        `"${result.address}"`,
        `"${result.website}"`,
        result.distance
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'kundensuche.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleCustomer = (name: string) => {
    setSelectedCustomers(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const toggleAllCustomers = () => {
    const allSelected = Object.keys(selectedCustomers).length === searchResults.length;
    if (allSelected) {
      setSelectedCustomers({});
    } else {
      const newSelected = searchResults.reduce((acc, result) => {
        acc[result.name] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedCustomers(newSelected);
    }
  };

  const addSelectedToCustomerList = async () => {
    const selectedResults = searchResults.filter(result => selectedCustomers[result.name]);

    if (selectedResults.length === 0) {
      toast({
        title: "Keine Kunden ausgewählt",
        description: "Bitte wählen Sie mindestens einen Kunden aus.",
        variant: "destructive",
      });
      return;
    }

    // Transform the data to match the required customer schema
    const customersToAdd = selectedResults.map(result => {
      const nameParts = result.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        firstName,
        lastName,
        company: result.name,
        phoneNumber: result.phoneNumber || '',
        email: result.email || '',
        address: result.address || ''
      };
    });

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customersToAdd),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Hinzufügen der Kunden');
      }

      toast({
        title: "Kunden hinzugefügt",
        description: `${selectedResults.length} Kunden wurden zur Kundenliste hinzugefügt.`,
      });

      setSelectedCustomers({});
    } catch (error) {
      console.error('Error adding customers:', error);
      toast({
        title: "Fehler",
        description: "Die Kunden konnten nicht zur Kundenliste hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kundensuche</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              <FormField
                control={form.control}
                name="searchTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branche oder Firmenname</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="z.B. Zahnarzt, Autowerkstatt..." />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standort</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="z.B. München, Hamburg..." />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="radius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Umkreis (in km)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" max="50" step="1" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSearching}>
                <Search className="mr-2 h-4 w-4" />
                {isSearching ? "Suche läuft..." : "Suchen"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Gefundene Unternehmen ({searchResults.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAll"
                    checked={Object.keys(selectedCustomers).length === searchResults.length}
                    onCheckedChange={toggleAllCustomers}
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium">
                    Alle auswählen
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={toggleSort}>
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  Nach Entfernung {sortDirection === 'asc' ? 'aufsteigend' : 'absteigend'}
                </Button>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Als CSV exportieren
                </Button>
                <Button
                  variant="default"
                  onClick={addSelectedToCustomerList}
                  disabled={Object.keys(selectedCustomers).length === 0}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {Object.keys(selectedCustomers).length} Kunden hinzufügen
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedCustomers[result.name]}
                        onCheckedChange={() => toggleCustomer(result.name)}
                      />
                      <h3 className="font-medium">{result.name}</h3>
                    </div>
                  </div>
                  {result.industry && (
                    <p className="text-sm text-muted-foreground ml-6">Branche: {result.industry}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {result.distance} km entfernt
                    </p>
                  </div>
                  {result.address && (
                    <p className="text-sm mt-1 ml-6">{result.address}</p>
                  )}
                  <div className="mt-2 space-y-1 text-sm ml-6">
                    {result.phoneNumber && (
                      <p>📞 {result.phoneNumber}</p>
                    )}
                    {result.email && (
                      <p>📧 {result.email}</p>
                    )}
                    {result.website && (
                      <p>🌐 <a href={result.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{result.website}</a></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}