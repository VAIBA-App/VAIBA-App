import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Upload } from "lucide-react";

interface Product {
  id: number;
  name: string;
  type: string;
  quantity: number;
  image?: string;
}

interface Service {
  id: number;
  name: string;
  appointments: Date[];
}

export default function PortfolioPage() {
  const [products, setProducts] = useState<Product[]>([{
    id: 1,
    name: "",
    type: "",
    quantity: 0
  }]);

  const [services, setServices] = useState<Service[]>([{
    id: 1,
    name: "",
    appointments: []
  }]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleAddProduct = () => {
    setProducts([...products, {
      id: products.length + 1,
      name: "",
      type: "",
      quantity: 0
    }]);
  };

  const handleProductChange = (id: number, field: keyof Product, value: string | number) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  const handleServiceChange = (id: number, name: string) => {
    setServices(services.map(service =>
      service.id === id ? { ...service, name } : service
    ));
  };

  const handleImageUpload = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProductChange(id, 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateSelect = (date: Date | undefined, serviceId: number) => {
    if (date) {
      setServices(services.map(service =>
        service.id === serviceId
          ? { ...service, appointments: [...service.appointments, date] }
          : service
      ));
    }
    setSelectedDate(date);
  };

  return (
    <div className="space-y-8 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Produkte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="grid grid-cols-4 gap-4 items-center">
              <div>
                <Label>Produktname</Label>
                <Input
                  value={product.name}
                  onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                  placeholder="Produktname eingeben"
                />
              </div>
              <div>
                <Label>Art des Produkts</Label>
                <Input
                  value={product.type}
                  onChange={(e) => handleProductChange(product.id, 'type', e.target.value)}
                  placeholder="Art eingeben"
                />
              </div>
              <div>
                <Label>Anzahl</Label>
                <Input
                  type="number"
                  value={product.quantity}
                  onChange={(e) => handleProductChange(product.id, 'quantity', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Bild</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(product.id, e)}
                    className="hidden"
                    id={`image-upload-${product.id}`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById(`image-upload-${product.id}`)?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bild hochladen
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button onClick={handleAddProduct} variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Weiteres Produkt hinzufügen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dienstleistungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map(service => (
            <div key={service.id} className="space-y-4">
              <div>
                <Label>Name der Dienstleistung</Label>
                <Input
                  value={service.name}
                  onChange={(e) => handleServiceChange(service.id, e.target.value)}
                  placeholder="Dienstleistung eingeben"
                />
              </div>
              <div>
                <Label>Termine</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => handleDateSelect(date, service.id)}
                  className="border rounded-md p-4"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
