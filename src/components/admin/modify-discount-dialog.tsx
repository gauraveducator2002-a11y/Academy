'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { DiscountCode } from '@/context/content-context';

const formSchema = z.object({
  code: z.string().min(3, { message: 'Code must be at least 3 characters.' }).max(10, { message: 'Code cannot exceed 10 characters.' }),
  discount: z.coerce.number().min(1, { message: 'Discount must be at least 1%.' }).max(100, { message: 'Discount cannot exceed 100%.' }),
});

interface ModifyDiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: DiscountCode) => void;
  discountCode: DiscountCode;
}

export function ModifyDiscountDialog({
  isOpen,
  onClose,
  onConfirm,
  discountCode,
}: ModifyDiscountDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: discountCode.code,
      discount: discountCode.discount,
    },
  });
  
  useEffect(() => {
    form.reset({
      code: discountCode.code,
      discount: discountCode.discount
    })
  }, [discountCode, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onConfirm({ ...discountCode, ...values, code: values.code.toUpperCase() });
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modify Discount Code</DialogTitle>
          <DialogDescription>
            Update the code or discount percentage for &quot;{discountCode.code}&quot;.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Code</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., SUMMER24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Percentage</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} className="pl-7" />
                    </FormControl>
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
