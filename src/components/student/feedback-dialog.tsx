'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquarePlus, Send, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  studentName: z.string().min(1, 'Please enter your name.'),
  rating: z.number().min(1, 'Please select a rating.'),
  feedback: z.string().optional(),
  suggestion: z.string().optional(),
}).refine(data => data.feedback || data.suggestion, {
  message: 'Please provide either feedback or a suggestion.',
  path: ['feedback'],
});


interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedbackSubmit: (details: {
    studentName: string;
    feedback: string;
    suggestion: string;
    rating: number;
  }) => void;
}

export function FeedbackDialog({
  isOpen,
  onClose,
  onFeedbackSubmit,
}: FeedbackDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: '',
      rating: 0,
      feedback: '',
      suggestion: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onFeedbackSubmit({
      studentName: values.studentName,
      feedback: values.feedback || '',
      suggestion: values.suggestion || '',
      rating: values.rating,
    });
    
    toast({
      title: 'Feedback Submitted!',
      description: 'Thank you for your valuable input.',
    });
    
    setIsLoading(false);
    onClose();
    form.reset();
  }
  
  const handleClose = () => {
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            We value your opinion. Let us know what you think or what we can
            improve.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-8 w-8 cursor-pointer transition-colors',
                            field.value >= star
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-muted-foreground/50'
                          )}
                          onClick={() => field.onChange(star)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What do you like? What's not working?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="suggestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suggestions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What new features or content would you like to see?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Feedback
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
