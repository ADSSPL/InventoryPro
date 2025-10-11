import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Users, Mail, Phone, MapPin, Building2, Edit } from "lucide-react";
import { useState } from "react";
import ClientForm from "@/components/forms/client-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Client } from "@shared/schema";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (isLoading) {
    return (
      <div className="pt-16 lg:pt-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
              <p className="text-gray-600">Manage your client relationships</p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
            <p className="text-gray-600">Manage your client relationships</p>
          </div>
          <Button onClick={() => {
            setEditingClient(undefined);
            setIsClientFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
          <div className="text-sm text-gray-600">
            {filteredClients.length} of {clients?.length || 0} clients
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
              </p>
              <Button onClick={() => {
                setEditingClient(undefined);
                setIsClientFormOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="border border-gray-100 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <p className="text-sm text-blue-600 font-medium">ID: {client.customerId}</p>
                          {client.company && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              {client.company}
                            </p>
                          )}
                        </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingClient(client);
                        setIsClientFormOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{client.email}</span>
                    </div>
                    
                    {client.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{client.phone}</span>
                      </div>
                    )}
                    
                    {(client.address || client.city || client.state) && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="text-sm text-gray-900">
                          {client.address && <div>{client.address}</div>}
                          {(client.city || client.state) && (
                            <div>
                              {client.city}{client.city && client.state && ', '}{client.state} {client.zipCode}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(client.gst || client.pan) && (
                      <div className="flex items-start space-x-3">
                        <div className="h-4 w-4 text-gray-400 mt-0.5">📄</div>
                        <div className="text-sm text-gray-900">
                          {client.gst && <div>GST: {client.gst}</div>}
                          {client.pan && <div>PAN: {client.pan}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isClientFormOpen} onOpenChange={(open) => {
        setIsClientFormOpen(open);
        if (!open) setEditingClient(undefined);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSuccess={() => {
              setIsClientFormOpen(false);
              setEditingClient(undefined);
            }}
            onCancel={() => {
              setIsClientFormOpen(false);
              setEditingClient(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
