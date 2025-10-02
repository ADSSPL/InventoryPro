import { X, Calendar, User, Package, IndianRupee, Settings, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product } from "@shared/schema";

interface ProductDetailsSliderProps {
  adsId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailsSlider({ adsId, isOpen, onClose }: ProductDetailsSliderProps) {
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/adsId/${adsId}`],
    enabled: isOpen && !!adsId,
  });


  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
            {product && (
              <p className="text-sm text-gray-600">
                {product.brand} {product.model}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : product ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">ADS ID</label>
                      <p className="text-sm font-mono font-medium text-gray-900">{product.adsId}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reference</label>
                      <p className="text-sm font-mono text-gray-900">{product.referenceNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</label>
                      <p className="text-sm font-medium text-gray-900">{product.brand}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Model</label>
                      <p className="text-sm text-gray-900">{product.model}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                    <Badge variant="outline" className="capitalize">
                      {product.productType || 'N/A'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cost Price</label>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(product.costPrice)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Product Details */}
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product ID</label>
                      <p className="text-sm font-mono text-gray-900">{product.prodId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Health Status</label>
                      <Badge variant="outline" className="capitalize">
                        {product.prodHealth || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Status</label>
                      <Badge variant="outline" className="capitalize">
                        {product.orderStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specifications */}
              {product.specifications && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Technical Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{product.specifications}</p>
                  </CardContent>
                </Card>
              )}

              {/* Audit Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Audit Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created By</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {product.createdBy || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Modified By</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {product.lastModifiedBy || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</label>
                      <p className="text-sm text-gray-900">{formatDate(product.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Modified</label>
                      <p className="text-sm text-gray-900">{formatDate(product.lastModifiedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Information */}
              {(product.lastAuditDate || product.auditStatus || product.maintenanceStatus) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Audit Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Audit Status</label>
                        <Badge variant="outline" className="capitalize">
                          {product.auditStatus || 'N/A'}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Maintenance Status</label>
                        <Badge variant="outline" className="capitalize">
                          {product.maintenanceStatus || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    {product.lastAuditDate && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Audit Date</label>
                        <p className="text-sm text-gray-900">{formatDate(product.lastAuditDate)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Dates */}
              {product.maintenanceDate && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-900">Additional Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {product.maintenanceDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Maintenance Date:</span>
                        <span className="text-sm text-gray-900">{formatDate(product.maintenanceDate)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Failed to load product details</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}