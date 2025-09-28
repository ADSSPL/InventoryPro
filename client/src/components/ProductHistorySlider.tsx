import { useQuery } from "@tanstack/react-query";
import { X, Clock, User, History, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import type { Product } from "@shared/schema";

interface AuditSnapshot {
  productState: Product;
  updatedBy: string;
  timestamp: string;
  action: 'CREATED' | 'UPDATED';
}

interface ProductHistory {
  adsId: string;
  brand: string;
  model: string;
  auditTrail: AuditSnapshot[];
}

interface ProductHistorySliderProps {
  adsId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductHistorySlider({ adsId, isOpen, onClose }: ProductHistorySliderProps) {
  const { data: history, isLoading, refetch } = useQuery<ProductHistory>({
    queryKey: [`/api/products/${adsId}/history`],
    enabled: isOpen && !!adsId,
    refetchOnWindowFocus: true,
    refetchInterval: 2000, // Refetch every 2 seconds when open
  });

  // Log data for debugging
  if (history) {
    console.log('ProductHistorySlider received data:', history);
    console.log('Audit trail length:', history?.auditTrail?.length);
    console.log('Audit trail entries:', history?.auditTrail);
  }

  const [expandedStates, setExpandedStates] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedStates(newExpanded);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangedFields = (current: Product, previous?: Product) => {
    if (!previous) return [];

    const changes: Array<{ field: string, oldValue: any, newValue: any }> = [];
    const fieldsToCheck = [
      'brand', 'model', 'condition', 'costPrice', 'specifications', 
      'prodId', 'prodHealth', 'prodStatus', 'orderStatus', 'productType',
      'lastAuditDate', 'auditStatus', 'maintenanceDate', 'maintenanceStatus'
    ];

    fieldsToCheck.forEach(field => {
      const currentValue = (current as any)[field];
      const previousValue = (previous as any)[field];
      
      if (currentValue !== previousValue) {
        changes.push({
          field: field,
          oldValue: previousValue,
          newValue: currentValue
        });
      }
    });

    return changes;
  };

  const formatFieldName = (field: string) => {
    const fieldNames: Record<string, string> = {
      'costPrice': 'Cost Price',
      'prodId': 'Product ID',
      'prodHealth': 'Health Status',
      'prodStatus': 'Availability Status',
      'orderStatus': 'Order Status',
      'productType': 'Product Type',
      'lastAuditDate': 'Last Audit Date',
      'auditStatus': 'Audit Status',
      'maintenanceDate': 'Maintenance Date',
      'maintenanceStatus': 'Maintenance Status'
    };
    return fieldNames[field] || field.charAt(0).toUpperCase() + field.slice(1);
  };

  const formatFieldValue = (field: string, value: any) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    if (field === 'costPrice') {
      return formatCurrency(value);
    }
    
    return String(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <History className="h-5 w-5 mr-2" />
              Product History Timeline
            </h2>
            {history && (
              <p className="text-sm text-gray-600">
                {history.brand} {history.model} • {history.auditTrail.length} state(s)
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : history ? (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                {history.auditTrail.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No state changes recorded yet</p>
                    <p className="text-xs text-gray-400 mt-1">Product history will appear here after updates</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {history.auditTrail.slice().reverse().map((snapshot, index) => {
                      const isExpanded = expandedStates.has(index);
                      const product = snapshot.productState;
                      const previousSnapshot = history.auditTrail.slice().reverse()[index + 1];
                      const changes = previousSnapshot ? getChangedFields(product, previousSnapshot.productState) : [];

                      return (
                        <div key={index} className="relative flex items-start space-x-4">
                          {/* Timeline dot */}
                          <div className={`flex-shrink-0 w-3 h-3 rounded-full border-4 border-white shadow-sm z-10 ${
                            snapshot.action === 'CREATED' ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <Card className={`border-l-4 ${
                              snapshot.action === 'CREATED' ? 'border-l-green-500' : 'border-l-blue-500'
                            }`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Badge variant={snapshot.action === 'CREATED' ? "default" : "outline"} className="capitalize">
                                      {snapshot.action}
                                    </Badge>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {formatDate(snapshot.timestamp)}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex items-center text-xs text-gray-500">
                                      <User className="h-3 w-3 mr-1" />
                                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                        {snapshot.updatedBy}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleExpanded(index)}
                                      className="h-6 w-6 p-0"
                                    >
                                      {isExpanded ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Show changes summary for UPDATED actions */}
                                {snapshot.action === 'UPDATED' && changes.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-600 font-medium mb-2">
                                      Changes Made ({changes.length} field{changes.length > 1 ? 's' : ''}):
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {changes.map((change, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {formatFieldName(change.field)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardHeader>

                              {isExpanded && (
                                <CardContent className="pt-0">
                                  {/* Show detailed changes for UPDATED actions */}
                                  {snapshot.action === 'UPDATED' && changes.length > 0 && (
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                      <h4 className="text-sm font-medium text-blue-800 mb-3">Field Changes</h4>
                                      <div className="space-y-3">
                                        {changes.map((change, idx) => (
                                          <div key={idx} className="flex items-center space-x-2 text-xs">
                                            <span className="font-medium text-gray-700 min-w-[100px]">
                                              {formatFieldName(change.field)}:
                                            </span>
                                            <div className="flex items-center space-x-2 flex-1">
                                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded truncate max-w-[120px]">
                                                {formatFieldValue(change.field, change.oldValue)}
                                              </span>
                                              <ArrowRight className="h-3 w-3 text-gray-400" />
                                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded truncate max-w-[120px]">
                                                {formatFieldValue(change.field, change.newValue)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-gray-600">ADS ID:</span>
                                        <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                          {product.adsId}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Brand:</span>
                                        <span className="ml-2 font-medium">{product.brand}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Model:</span>
                                        <span className="ml-2">{product.model}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Type:</span>
                                        <Badge variant="outline" className="ml-2 capitalize text-xs">
                                          {product.productType || 'N/A'}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Condition:</span>
                                        <Badge variant="outline" className="ml-2 capitalize text-xs">
                                          {product.condition}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-gray-600">Cost Price:</span>
                                        <span className="ml-2 font-semibold text-green-600">
                                          {formatCurrency(product.costPrice)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Product ID:</span>
                                        <span className="ml-2 font-mono text-xs">
                                          {product.prodId || 'N/A'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Health:</span>
                                        <Badge variant="outline" className="ml-2 capitalize text-xs">
                                          {product.prodHealth || 'N/A'}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Status:</span>
                                        <Badge variant="outline" className="ml-2 capitalize text-xs">
                                          {product.prodStatus || 'N/A'}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Order Status:</span>
                                        <Badge variant="outline" className="ml-2 capitalize text-xs">
                                          {product.orderStatus}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {product.specifications && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                      <span className="text-gray-600 text-sm">Specifications:</span>
                                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                                        {product.specifications}
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              )}
                            </Card>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Failed to load product history</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}