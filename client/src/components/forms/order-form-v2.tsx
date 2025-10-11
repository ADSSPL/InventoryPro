import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, User, Package, Calendar, Trash2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Client, Product } from "@shared/schema";
import ClientForm from "./client-form";

interface OrderFormV2Props {
  onSuccess: () => void;
  onCancel: () => void;
}

interface SelectedProduct {
  adsId: string;
  brand: string;
  model: string;
  price: number;
}

type CustomerType = 'new' | 'existing' | null;
type SearchField = 'name' | 'pan' | 'gst' | 'id';

export default function OrderFormV2({ onSuccess, onCancel }: OrderFormV2Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [customerType, setCustomerType] = useState<CustomerType>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null);
  const [orderType, setOrderType] = useState<'RENT' | 'PURCHASE'>('PURCHASE');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  
  // Search states
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerSearchField, setCustomerSearchField] = useState<SearchField>('name');
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Order details state
  const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderDeliveryStatus, setOrderDeliveryStatus] = useState<'pending' | 'in_transit' | 'delivered'>('pending');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);

  // Fetch all clients for existing customer search
  const { data: allClients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: customerType === 'existing'
  });

  // Fetch available products (only INVENTORY status)
  const { data: availableProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/available"],
  });

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!allClients || !customerSearchQuery) return allClients || [];
    
    const query = customerSearchQuery.toLowerCase();
    
    return allClients.filter(client => {
      switch (customerSearchField) {
        case 'pan':
          return client.pan?.toUpperCase().includes(customerSearchQuery.toUpperCase());
        case 'gst':
          return client.gst?.toUpperCase().includes(customerSearchQuery.toUpperCase());
        case 'id':
          return client.customerId.toLowerCase().includes(query);
        case 'name':
        default:
          return client.name.toLowerCase().includes(query);
      }
    });
  }, [allClients, customerSearchQuery, customerSearchField]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!availableProducts || !productSearchQuery) return [];
    
    const query = productSearchQuery.toLowerCase();
    
    return availableProducts.filter(product =>
      product.adsId.includes(productSearchQuery) ||
      `${product.brand} ${product.model}`.toLowerCase().includes(query)
    );
  }, [availableProducts, productSearchQuery]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return selectedProducts.reduce((sum, product) => sum + product.price, 0);
  }, [selectedProducts]);

  const discountAmount = useMemo(() => {
    return subtotal * (discountPercentage / 100);
  }, [subtotal, discountPercentage]);

  const totalPayment = useMemo(() => {
    return subtotal - discountAmount + (orderType === 'RENT' ? securityDeposit : 0);
  }, [subtotal, discountAmount, orderType, securityDeposit]);

  // Generate Order ID
  const generateOrderId = (customerId: number): string => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `ORD${customerId.toString().padStart(6, '0')}_${dateStr}`;
  };

  // Add product to order
  const addProduct = (product: Product) => {
    if (selectedProducts.find(p => p.adsId === product.adsId)) {
      toast({
        title: "Product already added",
        description: "This product is already in the order",
        variant: "destructive",
      });
      return;
    }

    setSelectedProducts(prev => [...prev, {
      adsId: product.adsId,
      brand: product.brand,
      model: product.model,
      price: parseFloat(product.costPrice)
    }]);
    setProductSearchQuery("");
  };

  // Remove product from order
  const removeProduct = (adsId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.adsId !== adsId));
  };

  // Update product price
  const updateProductPrice = (adsId: string, price: number) => {
    setSelectedProducts(prev => prev.map(p =>
      p.adsId === adsId ? { ...p, price } : p
    ));
  };

  // Handle customer creation success
  const handleCustomerCreated = async () => {
    // Invalidate and refetch clients
    await queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    
    // Fetch the latest clients to get the newly created one
    const clients = queryClient.getQueryData<Client[]>(["/api/clients"]);
    if (clients && clients.length > 0) {
      // Get the most recently created client (last in array after refetch)
      const latestClient = clients[clients.length - 1];
      setSelectedCustomer(latestClient);
    }
    
    setCustomerType(null); // Close the form
    toast({
      title: "Customer created",
      description: "Customer has been added successfully",
    });
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create order");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/available"] });
      toast({
        title: "Order created successfully",
        description: `Order ${data.orderId} has been created`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    // Validation
    if (!selectedCustomer) {
      toast({
        title: "Customer required",
        description: "Please select or create a customer",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "Products required",
        description: "Please add at least one product to the order",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.some(p => p.price <= 0)) {
      toast({
        title: "Invalid prices",
        description: "All product selling prices must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!contractDate) {
      toast({
        title: "Contract date required",
        description: "Please select a contract date",
        variant: "destructive",
      });
      return;
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      toast({
        title: "Invalid discount",
        description: "Discount must be between 0 and 100%",
        variant: "destructive",
      });
      return;
    }

    // PURCHASE-specific validation
    if (orderType === 'PURCHASE') {
      if (subtotal === 0) {
        toast({
          title: "Invalid total",
          description: "Total amount cannot be zero for PURCHASE orders",
          variant: "destructive",
        });
        return;
      }

      if (totalPayment < 0) {
        toast({
          title: "Invalid payment amount",
          description: "Total payment cannot be negative. Adjust discount percentage.",
          variant: "destructive",
        });
        return;
      }
    }

    // RENT-specific validation
    if (orderType === 'RENT' && securityDeposit < 0) {
      toast({
        title: "Invalid security deposit",
        description: "Security deposit cannot be negative",
        variant: "destructive",
      });
      return;
    }

    // Prepare order data for PURCHASE
    const orderData = {
      customerId: selectedCustomer.id,
      orderId: generateOrderId(selectedCustomer.id),
      orderType,
      products: selectedProducts.map(p => ({
        adsId: p.adsId,
        price: p.price.toString()
      })),
      contractDate: new Date(contractDate).toISOString(),
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate).toISOString() : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      orderDeliveryStatus,
      discountPercentage,
      securityDeposit: orderType === 'RENT' ? securityDeposit : 0,
      createdBy: "ADS0001", // Should come from session
    };

    createOrderMutation.mutate(orderData);
  };

  // Get today's date for display
  const todayDisplay = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      {/* Header with Date */}
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4">
        <h3 className="text-lg font-semibold">Create New Order</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{todayDisplay}</span>
        </div>
      </div>

      {/* Step 1: Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Customer Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedCustomer ? (
            <>
              {/* Customer Type Selection */}
              {customerType === null && (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-24 flex-col space-y-2"
                    onClick={() => setCustomerType('new')}
                  >
                    <Plus className="h-6 w-6" />
                    <span>New Customer</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-24 flex-col space-y-2"
                    onClick={() => setCustomerType('existing')}
                  >
                    <Search className="h-6 w-6" />
                    <span>Existing Customer</span>
                  </Button>
                </div>
              )}

              {/* Existing Customer Search */}
              {customerType === 'existing' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomerType(null);
                        setCustomerSearchQuery("");
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Search By</Label>
                    <RadioGroup
                      value={customerSearchField}
                      onValueChange={(value) => setCustomerSearchField(value as SearchField)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="name" id="name" />
                        <Label htmlFor="name" className="font-normal cursor-pointer">Name</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="id" id="id" />
                        <Label htmlFor="id" className="font-normal cursor-pointer">Customer ID</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pan" id="pan" />
                        <Label htmlFor="pan" className="font-normal cursor-pointer">PAN</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gst" id="gst" />
                        <Label htmlFor="gst" className="font-normal cursor-pointer">GST</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={`Search by ${customerSearchField.toUpperCase()}...`}
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  </div>

                  {clientsLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="text-sm text-gray-600 mt-2">Loading customers...</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                      {filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No customers found</p>
                          <p className="text-sm">Try adjusting your search</p>
                        </div>
                      ) : (
                        filteredClients.slice(0, 10).map((client) => (
                          <div
                            key={client.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              setSelectedCustomer(client);
                              setCustomerType(null);
                            }}
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Customer ID: {client.customerId}</div>
                              <div className="flex space-x-4">
                                <span>Email: {client.email}</span>
                                {client.pan && <span>PAN: {client.pan}</span>}
                                {client.gst && <span>GST: {client.gst}</span>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* New Customer Form */}
              {customerType === 'new' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomerType(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <span className="text-sm text-gray-600">Create New Customer</span>
                  </div>
                  
                  <ClientForm
                    onSuccess={handleCustomerCreated}
                    onCancel={() => setCustomerType(null)}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="font-medium text-lg">{selectedCustomer.name}</div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    {selectedCustomer.customerId}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Email: {selectedCustomer.email}</div>
                  {selectedCustomer.phone && <div>Phone: {selectedCustomer.phone}</div>}
                  {selectedCustomer.company && <div>Company: {selectedCustomer.company}</div>}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerType(null);
                }}
              >
                Change
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Order Type */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>Order Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={orderType}
              onValueChange={(value) => setOrderType(value as 'RENT' | 'PURCHASE')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="PURCHASE" id="purchase" className="peer sr-only" />
                <Label
                  htmlFor="purchase"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
                >
                  <Package className="mb-2 h-6 w-6" />
                  <span className="font-semibold">PURCHASE</span>
                  <span className="text-sm text-gray-600">One-time Payment</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="RENT" id="rent" className="peer sr-only" />
                <Label
                  htmlFor="rent"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
                >
                  <Calendar className="mb-2 h-6 w-6" />
                  <span className="font-semibold">RENT</span>
                  <span className="text-sm text-gray-600">Monthly Payment</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Product Selection */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Product Selection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by ADS ID or Product Name... (Press Enter to add)"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredProducts.length > 0) {
                    e.preventDefault();
                    addProduct(filteredProducts[0]);
                  }
                }}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            {/* Product Search Results */}
            {productSearchQuery && (
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2 bg-gray-50">
                {productsLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No available products found
                  </div>
                ) : (
                  filteredProducts.slice(0, 8).map((product) => (
                    <div
                      key={product.adsId}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors"
                      onClick={() => addProduct(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{product.brand} {product.model}</div>
                          <div className="text-sm text-gray-600">
                            ADS ID: {product.adsId}
                          </div>
                        </div>
                        <Badge variant="outline">₹{parseFloat(product.costPrice).toLocaleString()}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected Products Table */}
            {selectedProducts.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-medium">
                  Selected Products ({selectedProducts.length})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">ADS ID</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="w-[180px]">
                          {orderType === 'RENT' ? 'Monthly Rental (₹)' : 'Selling Price (₹)'}
                        </TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProducts.map((product) => (
                        <TableRow key={product.adsId}>
                          <TableCell className="font-mono text-sm">{product.adsId}</TableCell>
                          <TableCell>{product.brand} {product.model}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={product.price}
                              onChange={(e) => updateProductPrice(product.adsId, parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(product.adsId)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Order Details */}
      {selectedCustomer && selectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractDate">Contract Date *</Label>
                <Input
                  id="contractDate"
                  type="date"
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</Label>
                <Input
                  id="estimatedDeliveryDate"
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  min={contractDate}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Actual Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderStatus">Delivery Status</Label>
                <Select
                  value={orderDeliveryStatus}
                  onValueChange={(value) => setOrderDeliveryStatus(value as any)}
                >
                  <SelectTrigger id="orderStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requiredPieces">Required Pieces</Label>
                <Input
                  id="requiredPieces"
                  type="number"
                  value={selectedProducts.length}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Auto-calculated from selected products</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveredPieces">Delivered Pieces</Label>
                <Input
                  id="deliveredPieces"
                  type="number"
                  value={selectedProducts.length}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Equals required pieces initially</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
              <Input
                id="discountPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {orderType === 'RENT' && (
              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security Deposit (₹)</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Order Summary */}
      {selectedCustomer && selectedProducts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Products:</span>
                <span className="font-medium">{selectedProducts.length} items</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Required Pieces:</span>
                <span className="font-medium">{selectedProducts.length}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivered Pieces:</span>
                <span className="font-medium">{selectedProducts.length}</span>
              </div>

              <Separator />
              
              <div className="flex justify-between">
                <span className="text-gray-600">Quoted Price Total:</span>
                <span className="font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              {discountPercentage > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discountPercentage}%):</span>
                  <span className="font-medium">- ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              
              {orderType === 'RENT' && securityDeposit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span className="font-medium">+ ₹{securityDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Payment:</span>
                <span className="text-blue-600">₹{totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {orderType === 'PURCHASE' && (
                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <strong>Note:</strong> Total Payment = Quoted Price - Discount %
                </div>
              )}

              {orderType === 'RENT' && (
                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <strong>Note:</strong> Monthly rental amount per product. Security deposit is refundable.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 sticky bottom-0 bg-white pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            createOrderMutation.isPending ||
            !selectedCustomer ||
            selectedProducts.length === 0 ||
            !contractDate
          }
        >
          {createOrderMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
}