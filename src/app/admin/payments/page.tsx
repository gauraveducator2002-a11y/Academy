'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Tag, IndianRupee, Save, Trash2, Pencil } from 'lucide-react';
import { ContentContext, DiscountCode } from '@/context/content-context';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { ModifyDiscountDialog } from '@/components/admin/modify-discount-dialog';

const discountFormSchema = z.object({
    code: z.string().min(3, { message: 'Code must be at least 3 characters.' }).max(10, { message: 'Code cannot exceed 10 characters.'}),
    discount: z.coerce.number().min(1, { message: 'Discount must be at least 1%.' }).max(100, { message: 'Discount cannot exceed 100%.'}),
});

const pricingFormSchema = z.object({
    notePriceInr: z.coerce.number().min(0, "Price must be positive."),
    quizPriceInr: z.coerce.number().min(0, "Price must be positive."),
});


export default function PaymentsPage() {
    const { transactions, discountCodes, addDiscountCode, pricing, setPricing, deleteDiscountCode, updateDiscountCode } = useContext(ContentContext);
    const { toast } = useToast();
    const [isDiscountLoading, setIsDiscountLoading] = useState(false);
    const [isPricingLoading, setIsPricingLoading] = useState(false);
    const [codeToDelete, setCodeToDelete] = useState<DiscountCode | null>(null);
    const [codeToModify, setCodeToModify] = useState<DiscountCode | null>(null);

    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const discountForm = useForm<z.infer<typeof discountFormSchema>>({
        resolver: zodResolver(discountFormSchema),
        defaultValues: {
            code: '',
            discount: 10,
        },
    });

    const pricingForm = useForm<z.infer<typeof pricingFormSchema>>({
        resolver: zodResolver(pricingFormSchema),
        defaultValues: pricing,
    });

    async function onDiscountSubmit(values: z.infer<typeof discountFormSchema>) {
        setIsDiscountLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        addDiscountCode({ code: values.code.toUpperCase(), discount: values.discount });
        toast({
            title: 'Success!',
            description: `Discount code "${values.code.toUpperCase()}" has been created.`,
        });
        discountForm.reset();
        setIsDiscountLoading(false);
    }
    
    async function onPricingSubmit(values: z.infer<typeof pricingFormSchema>) {
        setIsPricingLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPricing(values);
        toast({
            title: 'Success!',
            description: 'Content pricing has been updated.',
        });
        setIsPricingLoading(false);
    }

    const handleDeleteCode = () => {
        if (codeToDelete) {
            deleteDiscountCode(codeToDelete.id);
            toast({
                title: 'Success!',
                description: `Discount code "${codeToDelete.code}" has been deleted.`,
            });
            setCodeToDelete(null);
        }
    };
    
    const handleUpdateCode = (updatedCode: DiscountCode) => {
        updateDiscountCode(updatedCode);
        toast({
            title: 'Success!',
            description: `Discount code "${updatedCode.code}" has been updated.`,
        });
        setCodeToModify(null);
    };

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Payments & Discounts</h1>
        <p className="text-muted-foreground">Monitor transactions and manage student discounts and content pricing.</p>
      </div>
      
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>A log of all student purchases for content.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTransactions.length > 0 ? (
                                sortedTransactions.map((tx, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="font-medium">{tx.studentName}</div>
                                        </TableCell>
                                        <TableCell>{tx.contentTitle}</TableCell>
                                        <TableCell>₹{tx.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {tx.referenceCode ? (
                                                <Badge variant="secondary">{tx.referenceCode}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground/60">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{format(new Date(tx.timestamp), "PPp")}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No transactions yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div>
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Content Pricing</CardTitle>
                        <CardDescription>Set the default prices for new content uploads.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...pricingForm}>
                            <form onSubmit={pricingForm.handleSubmit(onPricingSubmit)} className="space-y-4">
                                <FormField control={pricingForm.control} name="notePriceInr" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default Note Price (INR)</FormLabel>
                                        <div className="relative">
                                            <FormControl><Input type="number" {...field} className="pl-8" /></FormControl>
                                            <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <FormField control={pricingForm.control} name="quizPriceInr" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default Quiz Price (INR)</FormLabel>
                                        <div className="relative">
                                            <FormControl><Input type="number" {...field} className="pl-8" /></FormControl>
                                            <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <Button type="submit" className="w-full" disabled={isPricingLoading}>
                                    {isPricingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Pricing
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Create Discount Code</CardTitle>
                        <CardDescription>Generate a new reference code to provide discounts to students.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...discountForm}>
                            <form onSubmit={discountForm.handleSubmit(onDiscountSubmit)} className="space-y-4">
                                <FormField
                                control={discountForm.control}
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
                                control={discountForm.control}
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
                                <Button type="submit" className="w-full" disabled={isDiscountLoading}>
                                    {isDiscountLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    Create Code
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Active Discount Codes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                        {discountCodes.length > 0 ? (
                            discountCodes.map(dc => (
                                <div key={dc.id} className="flex justify-between items-center p-2 rounded-md bg-secondary">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-mono text-sm font-semibold">{dc.code}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{dc.discount}% OFF</Badge>
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCodeToModify(dc)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Modify</span>
                                        </Button>
                                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => setCodeToDelete(dc)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">No active discount codes.</p>
                        )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
        <DeleteConfirmationDialog
            isOpen={!!codeToDelete}
            onClose={() => setCodeToDelete(null)}
            onConfirm={handleDeleteCode}
            itemType="discount code"
            itemName={codeToDelete?.code || ''}
        />
        {codeToModify && (
             <ModifyDiscountDialog
                isOpen={!!codeToModify}
                onClose={() => setCodeToModify(null)}
                onConfirm={handleUpdateCode}
                discountCode={codeToModify}
            />
        )}
    </>
  );
}
