import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";

interface InventoryDistributionProps {
  products?: Product[];
  isLoading: boolean;
}

export default function InventoryDistribution({ products, isLoading }: InventoryDistributionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-24 h-2 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!products) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Inventory Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <p>No inventory data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate distribution
  const laptops = products.filter(p => p.productType === "laptop");
  const desktops = products.filter(p => p.productType === "desktop");

  const laptopCount = laptops.length;
  const desktopCount = desktops.length;

  const total = laptopCount + desktopCount;

  const distributions = [
    {
      name: "Laptops",
      count: laptopCount,
      percentage: total > 0 ? (laptopCount / total) * 100 : 0,
      color: "bg-primary",
    },
    {
      name: "Desktops",
      count: desktopCount,
      percentage: total > 0 ? (desktopCount / total) * 100 : 0,
      color: "bg-secondary",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900">Inventory Distribution</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary text-sm hover:underline">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distributions.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                <span className="text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-2 ${item.color} rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
