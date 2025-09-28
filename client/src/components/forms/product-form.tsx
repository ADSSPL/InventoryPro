import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { insertProductSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { InsertProduct, Product } from "@shared/schema";

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const response = await fetch("/api/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    },
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    mode: 'onChange',
    defaultValues: {
      brand: "",
      model: "",
      productType: "laptop",
      condition: "new",
      costPrice: 0.00,
      specifications: "",
      prodId: "",
      prodHealth: "working",
      prodStatus: "available",
      lastAuditDate: "",
      auditStatus: "",
      maintenanceDate: "",
      maintenanceStatus: "",
      orderStatus: "INVENTORY",
    },
  });

  // Watch for product creation to show generated IDs
  const [generatedAdsId, setGeneratedAdsId] = useState<string>("");
  const [generatedReferenceNumber, setGeneratedReferenceNumber] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Prefill form when editing
  useEffect(() => {
    if (product) {
      form.reset({
        brand: product.brand,
        model: product.model,
        productType: (product.productType === "laptop" || product.productType === "desktop") ? product.productType : "laptop",
        condition: product.condition as "new" | "refurbished" | "used" || "new",
        costPrice: parseFloat(product.costPrice) || 0,
        specifications: product.specifications || "",
        prodId: product.prodId || "",
        prodHealth: product.prodHealth as "working" | "maintenance" | "expired" || "working",
        prodStatus: product.prodStatus as "available" | "leased" | "sold" | "leased but not working" | "leased but maintenance" | "returned" || "available",
        lastAuditDate: product.lastAuditDate || "",
        auditStatus: product.auditStatus || "",
        maintenanceDate: product.maintenanceDate || "",
        maintenanceStatus: product.maintenanceStatus || "",
        orderStatus: product.orderStatus as "INVENTORY" | "RENT" | "PURCHASE" || "INVENTORY",
        // createdBy is not shown in form, handled automatically
      });
    } else {
      form.reset({
        brand: "",
        model: "",
        productType: "laptop",
        condition: "new",
        costPrice: 0.00,
        specifications: "",
        prodId: "",
        prodHealth: "working",
        prodStatus: "available",
        lastAuditDate: "",
        auditStatus: "",
        maintenanceDate: "",
        maintenanceStatus: "",
        orderStatus: "INVENTORY",
      });
    }
  }, [product, form]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Create mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: (product) => {
      // Set the generated IDs for display
      setGeneratedAdsId(product.adsId);
      setGeneratedReferenceNumber(product.referenceNumber);

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: `Product created successfully!\nAds ID: ${product.adsId}\nReference: ${product.referenceNumber}`,
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      if (!product) throw new Error("No product to update");
      const response = await apiRequest("PUT", `/api/products/${product.adsId}`, data);
      return response.json();
    },
    onSuccess: (updatedProduct) => {
      // Invalidate the specific product query
      queryClient.invalidateQueries({ queryKey: [`/api/products/adsId/${updatedProduct.adsId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    console.log("Form submitted with data:", data);
    console.log("Current user:", currentUser);

    if (product) {
      console.log("Updating existing product");
      // For updates, automatically set lastModifiedBy to current user's employee ID
      const updateData = {
        ...data,
        lastModifiedBy: currentUser?.employeeId || "SYSTEM",
      };
      updateProductMutation.mutate(updateData);
    } else {
      // For new products, automatically set createdBy to current user's employee ID
      const productData = {
        ...data,
        createdBy: currentUser?.employeeId || "SYSTEM",
      };
      console.log("Creating new product with data:", productData);
      createProductMutation.mutate(productData);
    }
  };

  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Brand *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Apple, Dell, HP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Model *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MacBook Pro M3, XPS 13" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "laptop"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Condition</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Cost Price (₹) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="prodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Serial/Product ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MBP001, DXPS001" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Order Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "INVENTORY"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INVENTORY">In Inventory</SelectItem>
                      <SelectItem value="RENT">For Rent</SelectItem>
                      <SelectItem value="PURCHASE">For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="prodHealth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Health Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "working"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select health" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="working">Working</SelectItem>
                      <SelectItem value="maintenance">Needs Maintenance</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prodStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Availability Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "available"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="leased">Leased</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="leased but not working">Leased (Not Working)</SelectItem>
                      <SelectItem value="leased but maintenance">Leased (Maintenance)</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="specifications"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Technical Specifications</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., 16GB RAM, 512GB SSD, M2 Pro chip, 14-inch display..."
                    className="min-h-[100px] resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Display generated IDs for new products */}
        {generatedAdsId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="text-sm font-medium text-green-800">Product Created Successfully!</h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <FormLabel className="text-xs text-green-700 font-medium">ADS ID</FormLabel>
                <div className="flex space-x-2">
                  <Input value={generatedAdsId} readOnly className="bg-green-100 border-green-300 text-green-800 font-mono flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedAdsId)}
                    className="px-3"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
              <div>
                <FormLabel className="text-xs text-green-700 font-medium">Reference Number</FormLabel>
                <Input value={generatedReferenceNumber} readOnly className="bg-green-100 border-green-300 text-green-800 font-mono" />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading
              ? product
                ? "Saving Changes..."
                : "Creating Product..."
              : product
              ? "Save Changes"
              : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
