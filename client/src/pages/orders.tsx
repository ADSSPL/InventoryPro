import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FileText, ShoppingCart, Home } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OrderFormV2 from "@/components/forms/order-form-v2";
import type { Order, Client } from "@shared/schema";

type OrderType = 'PURCHASE' | 'RENT';

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>('PURCHASE');

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Create a map of customer IDs to customer details for quick lookup
  const clientMap = useMemo(() => {
    return new Map(clients?.map(c => [c.id, c]) || []);
  }, [clients]);

  // Filter by order type first, then by search
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    const typeFiltered = orders.filter(order => order.orderType === selectedOrderType);
    
    if (!searchTerm) return typeFiltered;
    
    const search = searchTerm.toLowerCase();
    return typeFiltered.filter(order => {
      const client = clientMap.get(order.customerId);
      return (
        order.orderId.toLowerCase().includes(search) ||
        client?.customerId.toLowerCase().includes(search) ||
        client?.name.toLowerCase().includes(search)
      );
    });
  }, [orders, selectedOrderType, searchTerm, clientMap]);

  if (isLoading) {
    return (
      <div className="pt-16 lg:pt-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
              <p className="text-gray-600">Manage customer orders and rentals</p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-80" />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead className="text-right">Total Payment</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-center">Discount %</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
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
            <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
            <p className="text-gray-600">Manage customer orders and rentals</p>
          </div>
          <Button onClick={() => setIsOrderFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Toggle and Search Row */}
        <div className="flex items-center justify-between mb-6">
          {/* BUY/RENT Toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <Button
              variant={selectedOrderType === 'PURCHASE' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedOrderType('PURCHASE')}
              className={selectedOrderType === 'PURCHASE'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'hover:bg-gray-100'
              }
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              BUY
            </Button>
            <Button
              variant={selectedOrderType === 'RENT' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedOrderType('RENT')}
              className={selectedOrderType === 'RENT'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'hover:bg-gray-100'
              }
            >
              <Home className="h-4 w-4 mr-2" />
              RENT
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by Order ID or Customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <div className="text-sm text-gray-600">
              {filteredOrders.length} {selectedOrderType === 'PURCHASE' ? 'Purchase' : 'Rental'} orders
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              {selectedOrderType === 'PURCHASE' ? (
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              ) : (
                <Home className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedOrderType === 'PURCHASE' ? 'purchase' : 'rental'} orders found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : `Get started by creating your first ${selectedOrderType === 'PURCHASE' ? 'purchase' : 'rental'} order`
                }
              </p>
              <Button onClick={() => setIsOrderFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Order
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead className="text-right">Total Payment</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-center">Discount %</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const client = clientMap.get(order.customerId);
                    const orderDate = new Date(order.contractDate);
                    
                    return (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="text-sm font-medium">
                            {orderDate.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{order.orderId}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {client?.customerId || `CX#${order.customerId}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">
                            ₹{parseFloat(order.totalPaymentReceived).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {order.deliveredPieces}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {order.requiredPieces}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm text-green-600 font-medium">
                            {order.discountPercentage ? `${parseFloat(order.discountPercentage).toFixed(2)}%` : '0%'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Form Dialog */}
      <Dialog open={isOrderFormOpen} onOpenChange={setIsOrderFormOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <OrderFormV2
            onSuccess={() => setIsOrderFormOpen(false)}
            onCancel={() => setIsOrderFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

//abhay prachi