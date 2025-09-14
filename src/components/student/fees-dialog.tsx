'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Tag, IndianRupee, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DiscountCode } from '@/context/content-context';

const formSchema = z.object({
  studentName: z.string().min(1, { message: 'Student name is required.' }),
  amount: z.coerce.number(),
  referenceCode: z.string().optional(),
  upiId: z.string().min(3).regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Invalid UPI ID format.'),
});


interface FeesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onPaymentSuccess: (details: { studentName: string; amount: number; referenceCode?: string; }) => void;
    contentTitle: string;
    contentPriceInr: number;
    discountCodes: DiscountCode[];
}

function UpiIcon({ name }: { name: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow">
                 <img
                    src={`https://cdn.iconscout.com/icon/free/png-256/${name.toLowerCase()}-226458.png`}
                    alt={`${name} logo`}
                    className="h-8 w-8 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerText = name.substring(0,2).toUpperCase(); }}
                />
            </div>
            <span className="text-xs font-medium">{name}</span>
        </div>
    )
}

type PaymentStatus = 'idle' | 'processing' | 'awaiting_confirmation' | 'success';


export function FeesDialog({ isOpen, onClose, onPaymentSuccess, contentTitle, contentPriceInr, discountCodes = [] }: FeesDialogProps) {
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: '',
      amount: contentPriceInr,
      referenceCode: '',
      upiId: '',
    },
  });
  
  useEffect(() => {
    form.setValue('amount', contentPriceInr);
  }, [contentPriceInr, form]);

  const watchedCode = useWatch({ control: form.control, name: 'referenceCode' });

  const { discount, finalAmount } = useMemo(() => {
    const code = discountCodes.find(c => c.code.toLowerCase() === watchedCode?.toLowerCase());
    if (code) {
      const discountValue = (contentPriceInr * code.discount) / 100;
      const newFinalAmount = contentPriceInr - discountValue;
      return { discount: discountValue, finalAmount: newFinalAmount > 0 ? newFinalAmount : 0 };
    }
    return { discount: 0, finalAmount: contentPriceInr };
  }, [watchedCode, discountCodes, contentPriceInr]);

  useEffect(() => {
    form.setValue('amount', finalAmount);
  }, [finalAmount, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setPaymentStatus('processing');
    
     if (finalAmount <= 0) {
      onPaymentSuccess(values);
      handleClose();
      return;
    }

    // Simulate API call to backend to initiate payment
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPaymentStatus('awaiting_confirmation');
    // Simulate waiting for UPI confirmation from the user's app
    await new Promise(resolve => setTimeout(resolve, 5000));

    setPaymentStatus('success');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Payment Successful',
      description: `Successfully purchased "${contentTitle}" for ₹${values.amount.toFixed(2)}.`,
    });
    
    onPaymentSuccess(values);
    handleClose();
  }

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        if (paymentStatus !== 'idle') {
            form.reset({studentName: '', amount: contentPriceInr, referenceCode: '', upiId: ''});
            setPaymentStatus('idle');
        }
    }, 500); // Delay to allow animation to complete
  }

  const buttonText = finalAmount <= 0 ? 'Access for Free' : `Pay ₹${finalAmount.toFixed(2)} with UPI & Proceed`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose();
    }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    {finalAmount <= 0 ? 'Access Content' : 'Complete Your Purchase'}
                </DialogTitle>
                <DialogDescription>
                  {finalAmount <= 0
                    ? `Access "${contentTitle}" for free by entering your name.` 
                    : `Pay for "${contentTitle}" to proceed. All transactions are secure.`
                  }
                </DialogDescription>
            </DialogHeader>

            {paymentStatus === 'awaiting_confirmation' && (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-semibold">Awaiting Payment Confirmation</p>
                    <p className="text-center text-sm text-muted-foreground">Please open your UPI app to approve the payment request for ₹{finalAmount.toFixed(2)}.</p>
                </div>
            )}
            
            {paymentStatus === 'success' && (
                 <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <p className="text-lg font-semibold">Success!</p>
                    <p className="text-center text-sm text-muted-foreground">You can now proceed.</p>
                </div>
            )}

            {(paymentStatus === 'idle' || paymentStatus === 'processing') && (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    {finalAmount > 0 && (
                        <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
                            <p className="text-sm font-medium">Pay with UPI</p>
                            <div className="flex justify-around">
                                <UpiIcon name="gpay" />
                                <UpiIcon name="phonepe" />
                                <UpiIcon name="paytm" />
                            </div>
                            <FormField
                                control={form.control}
                                name="upiId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>UPI ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="yourname@bank" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <FormField
                    control={form.control}
                    name="referenceCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Reference Code (Optional)</FormLabel>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input placeholder="Enter reference code" {...field} className="pl-9" />
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="space-y-2 rounded-lg border bg-secondary/50 p-4">
                        <div className="flex justify-between text-sm">
                            <span>Base Price</span>
                            <span>₹{contentPriceInr.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-accent">
                                <span>Discount</span>
                                <span>-₹{discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount</span>
                            <span>₹{finalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem className='hidden'>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                
                    <Button type="submit" className="w-full" disabled={paymentStatus !== 'idle'}>
                        {paymentStatus === 'processing' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                           buttonText
                        )}
                    </Button>
                </form>
                </Form>
            )}
        </DialogContent>
    </Dialog>
  );
}
