import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import SalesChart from "@/components/dashboard/sales-chart";
import InventoryDistribution from "@/components/dashboard/inventory-distribution";
import RecentSales from "@/components/dashboard/recent-sales";
import QuickActions from "@/components/dashboard/quick-actions";
import AlertsCard from "@/components/dashboard/alerts-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import ProductForm from "@/components/forms/product-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Dashboard() {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalInventory: number;
    monthlySales: number;
    activeClients: number;
    recoveryItems: number;
    salesGrowth: number;
    clientGrowth: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: sales, isLoading: salesLoading } = useQuery<{
    id: number;
    clientId: number;
    adsId: string;
    quantity: number;
    unitPrice: string;
    totalAmount: string;
    saleDate: string;
    status: string;
    notes: string | null;
    client: {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
      company: string | null;
      isActive: boolean;
    };
    product: {
      id: number;
      adsId: string;
      referenceNumber: string;
      name: string;
      sku: string;
      brand: string;
      model: string;
      category: string;
      price: string;
      cost: string;
      stockQuantity: number;
      specifications: string | null;
      description: string | null;
      isActive: boolean;
    };
  }[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<{
    id: number;
    adsId: string;
    referenceNumber: string;
    name: string;
    sku: string;
    brand: string;
    model: string;
    category: string;
    price: string;
    cost: string;
    stockQuantity: number;
    specifications: string | null;
    description: string | null;
    isActive: boolean;
  }[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="pt-16 lg:pt-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 hidden lg:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Welcome back! Here's your business overview.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products, clients..."
                className="w-64 pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <Button onClick={() => setIsProductFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SalesChart sales={sales} isLoading={salesLoading} />
          <InventoryDistribution products={products} isLoading={productsLoading} />
        </div>

        {/* Alerts Section */}
        <div className="mb-8">
          <AlertsCard products={products} isLoading={productsLoading} />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentSales sales={sales} isLoading={salesLoading} />
          </div>
          <QuickActions />
        </div>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSuccess={() => setIsProductFormOpen(false)}
            onCancel={() => setIsProductFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
