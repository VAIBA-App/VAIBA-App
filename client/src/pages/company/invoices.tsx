import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerAddress: string;
  items: {
    description: string;
    quantity: number;
    price: number;
  }[];
}

export default function InvoicesPage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "",
    date: new Date().toISOString().split('T')[0],
    dueDate: "",
    customerName: "",
    customerAddress: "",
    items: [{ description: "", quantity: 1, price: 0 }]
  });

  const handleAddItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: "", quantity: 1, price: 0 }]
    });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...invoiceData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  const calculateTotal = () => {
    return invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Rechnung erstellen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rechnungsnummer</Label>
              <Input
                value={invoiceData.invoiceNumber}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                placeholder="RE-2024-001"
              />
            </div>
            <div>
              <Label>Rechnungsdatum</Label>
              <Input
                type="date"
                value={invoiceData.date}
                onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Fälligkeitsdatum</Label>
              <Input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Kundeninformationen</Label>
            <Input
              value={invoiceData.customerName}
              onChange={(e) => setInvoiceData({ ...invoiceData, customerName: e.target.value })}
              placeholder="Kundenname"
            />
            <Textarea
              value={invoiceData.customerAddress}
              onChange={(e) => setInvoiceData({ ...invoiceData, customerAddress: e.target.value })}
              placeholder="Kundenadresse"
            />
          </div>

          <div className="space-y-4">
            <Label>Rechnungspositionen</Label>
            {invoiceData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-6 gap-4">
                <div className="col-span-3">
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Beschreibung"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    placeholder="Menge"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                    placeholder="Preis"
                  />
                </div>
                <div>
                  <div className="text-right font-semibold">
                    {(item.quantity * item.price).toFixed(2)} €
                  </div>
                </div>
              </div>
            ))}
            <Button onClick={handleAddItem} variant="outline">
              Position hinzufügen
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Gesamtbetrag:</span>
              <span>{calculateTotal().toFixed(2)} €</span>
            </div>
          </div>

          <Button className="w-full">
            Rechnung erstellen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
