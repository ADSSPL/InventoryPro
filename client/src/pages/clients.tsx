import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Users, Edit } from "lucide-react";
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
          <div className="mb-6">
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Total Security Money</TableHead>
                    <TableHead>GST/PAN</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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

        {/* Clients Table */}
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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Total Security Money</TableHead>
                    <TableHead>GST/PAN</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {client.customerId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{client.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{client.email}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{client.phone || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{client.company || '-'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          ₹{parseFloat(client.totalSecurityMoney).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {client.gst && <div className="text-gray-600">GST: {client.gst}</div>}
                          {client.pan && <div className="text-gray-600">PAN: {client.pan}</div>}
                          {!client.gst && !client.pan && <span className="text-gray-400">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
