import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Laptop, Monitor, Edit, Package, Filter, Upload, X, History } from "lucide-react";
import { useState } from "react";
import ProductForm from "@/components/forms/product-form";
import FileUpload from "@/components/FileUpload";
import ProductHistorySlider from "@/components/ProductHistorySlider";
import ProductDetailsSlider from "@/components/ProductDetailsSlider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Product } from "@shared/schema";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [prodHealthFilter, setProdHealthFilter] = useState<string[]>([]);
  const [prodStatusFilter, setProdStatusFilter] = useState<string[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string[]>([]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [detailsAdsId, setDetailsAdsId] = useState<string>("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [historyAdsId, setHistoryAdsId] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter(product => {
    // Search filter
    const matchesSearch = searchTerm === "" ||
      product.adsId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.prodId && product.prodId.toLowerCase().includes(searchTerm.toLowerCase()));

    // Brand filter
    const matchesBrand = brandFilter.length === 0 || brandFilter.includes(product.brand);

    // Product Health filter
    const matchesProdHealth = prodHealthFilter.length === 0 || prodHealthFilter.includes(product.prodHealth || "");

    // Product Status filter
    const matchesProdStatus = prodStatusFilter.length === 0 || prodStatusFilter.includes(product.prodStatus || "");

    // Order Status filter
    const matchesOrderStatus = orderStatusFilter.length === 0 || orderStatusFilter.includes(product.orderStatus || "");

    return matchesSearch && matchesBrand && matchesProdHealth && matchesProdStatus && matchesOrderStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="pt-16 lg:pt-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
              <p className="text-gray-600">Manage your laptop and computer inventory</p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <div className="p-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ADS ID</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Product Health</TableHead>
                    <TableHead>Product Status</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
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
            <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
            <p className="text-gray-600">Manage your laptop and computer inventory</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsFileUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV/Excel
            </Button>
            <Button onClick={() => setIsProductFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <div className="text-sm text-gray-600">
              {filteredProducts.length} of {products?.length || 0} products
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">Filters:</span>
            </div>

            {/* Brand Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={brandFilter.length > 0 ? "default" : "outline"}
                  size="sm"
                  className={`h-8 px-3 ${brandFilter.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  <span className="text-xs">Brand</span>
                  {brandFilter.length > 0 && (
                    <>
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {brandFilter.length}
                      </Badge>
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBrandFilter([]);
                        }}
                      />
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Brand</h4>
                    {brandFilter.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBrandFilter([])}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from(new Set(products?.map(p => p.brand) || [])).map((brand) => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={brandFilter.includes(brand)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBrandFilter([...brandFilter, brand]);
                            } else {
                              setBrandFilter(brandFilter.filter(b => b !== brand));
                            }
                          }}
                        />
                        <label htmlFor={`brand-${brand}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate">
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Product Health Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={prodHealthFilter.length > 0 ? "default" : "outline"}
                  size="sm"
                  className={`h-8 px-3 ${prodHealthFilter.length > 0 ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  <span className="text-xs">Health</span>
                  {prodHealthFilter.length > 0 && (
                    <>
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {prodHealthFilter.length}
                      </Badge>
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProdHealthFilter([]);
                        }}
                      />
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Product Health</h4>
                    {prodHealthFilter.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProdHealthFilter([])}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {["working", "maintenance", "expired"].map((health) => (
                      <div key={health} className="flex items-center space-x-2">
                        <Checkbox
                          id={`health-${health}`}
                          checked={prodHealthFilter.includes(health)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setProdHealthFilter([...prodHealthFilter, health]);
                            } else {
                              setProdHealthFilter(prodHealthFilter.filter(h => h !== health));
                            }
                          }}
                        />
                        <label htmlFor={`health-${health}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                          {health}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Product Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={prodStatusFilter.length > 0 ? "default" : "outline"}
                  size="sm"
                  className={`h-8 px-3 ${prodStatusFilter.length > 0 ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                >
                  <span className="text-xs">Status</span>
                  {prodStatusFilter.length > 0 && (
                    <>
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {prodStatusFilter.length}
                      </Badge>
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProdStatusFilter([]);
                        }}
                      />
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Product Status</h4>
                    {prodStatusFilter.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProdStatusFilter([])}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 gap-2">
                    {["available", "leased", "sold", "leased but not working", "leased but maintenance", "returned"].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={prodStatusFilter.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setProdStatusFilter([...prodStatusFilter, status]);
                            } else {
                              setProdStatusFilter(prodStatusFilter.filter(s => s !== status));
                            }
                          }}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Order Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={orderStatusFilter.length > 0 ? "default" : "outline"}
                  size="sm"
                  className={`h-8 px-3 ${orderStatusFilter.length > 0 ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                >
                  <span className="text-xs">Order</span>
                  {orderStatusFilter.length > 0 && (
                    <>
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {orderStatusFilter.length}
                      </Badge>
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderStatusFilter([]);
                        }}
                      />
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Order Status</h4>
                    {orderStatusFilter.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOrderStatusFilter([])}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {["INVENTORY", "RENT", "PURCHASE"].map((orderStatus) => (
                      <div key={orderStatus} className="flex items-center space-x-2">
                        <Checkbox
                          id={`order-${orderStatus}`}
                          checked={orderStatusFilter.includes(orderStatus)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setOrderStatusFilter([...orderStatusFilter, orderStatus]);
                            } else {
                              setOrderStatusFilter(orderStatusFilter.filter(o => o !== orderStatus));
                            }
                          }}
                        />
                        <label htmlFor={`order-${orderStatus}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                          {orderStatus}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear All Filters */}
            <div className="ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBrandFilter([]);
                  setProdHealthFilter([]);
                  setProdStatusFilter([]);
                  setOrderStatusFilter([]);
                }}
                className={`h-8 px-3 text-xs ${brandFilter.length > 0 || prodHealthFilter.length > 0 || prodStatusFilter.length > 0 || orderStatusFilter.length > 0 ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-gray-400'}`}
                disabled={brandFilter.length === 0 && prodHealthFilter.length === 0 && prodStatusFilter.length === 0 && orderStatusFilter.length === 0}
              >
                <X className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first product"}
              </p>
              <Button onClick={() => setIsProductFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ADS ID</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Product Health</TableHead>
                    <TableHead>Product Status</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.adsId} className="hover:bg-gray-50">
                      <TableCell>
                        <button
                          onClick={() => {
                            setDetailsAdsId(product.adsId);
                            setIsDetailsOpen(true);
                          }}
                          className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {product.adsId}
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{product.brand}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.prodHealth || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.prodStatus || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">₹{parseFloat(product.costPrice).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setHistoryAdsId(product.adsId);
                              setIsHistoryOpen(true);
                            }}
                            title="View History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isProductFormOpen || !!editProduct} onOpenChange={() => { setIsProductFormOpen(false); setEditProduct(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editProduct || undefined}
            onSuccess={() => { setIsProductFormOpen(false); setEditProduct(null); }}
            onCancel={() => { setIsProductFormOpen(false); setEditProduct(null); }}
          />
        </DialogContent>
      </Dialog>


      {/* File Upload Dialog */}
      <Dialog open={isFileUploadOpen} onOpenChange={setIsFileUploadOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Products from CSV/Excel</DialogTitle>
          </DialogHeader>
          <FileUpload />
        </DialogContent>
      </Dialog>

      {/* Product Details Slider */}
      <ProductDetailsSlider
        adsId={detailsAdsId}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsAdsId("");
        }}
      />

      {/* Product History Slider */}
      <ProductHistorySlider
        adsId={historyAdsId}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryAdsId("");
        }}
      />
    </div>
  );
}
