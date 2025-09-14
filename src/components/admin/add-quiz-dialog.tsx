'use client';

import { useState, useContext } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { classes, subjects } from '@/lib/data';
import { PlusCircle, Loader2, IndianRupee, BrainCircuit, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ContentContext, Quiz } from '@/context/content-context';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';

const questionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  question: z.string().min(1, 'Question text cannot be empty.'),
  options: z.array(z.string().min(1, 'Option text cannot be empty.')).length(4, 'There must be exactly 4 options.'),
  correctAnswer: z.coerce.number().min(0).max(3),
});

const quizSchema = z.object({
  classId: z.string({ required_error: 'Please select a class.' }),
  subjectId: z.string({ required_error: 'Please select a subject.' }),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(3, 'Description must be at least 3 characters.'),
  priceInr: z.coerce.number().min(0, 'Price must be a positive number.'),
  timeLimit: z.coerce.number().min(1, 'Time limit must be at least 1 minute.'),
  questions: z.array(questionSchema).min(1, 'A quiz must have at least one question.'),
});


export function AddQuizDialog({ onQuizAdded }: { onQuizAdded: (quiz: Omit<Quiz, 'id'>) => void; }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { pricing } = useContext(ContentContext);

  const form = useForm<z.infer<typeof quizSchema>>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      classId: '',
      subjectId: '',
      title: '',
      description: '',
      priceInr: pricing.quizPriceInr,
      timeLimit: 10,
      questions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions"
  });

  const onSubmit = async (values: z.infer<typeof quizSchema>) => {
    setIsLoading(true);
    try {
      onQuizAdded(values);
      setOpen(false);
      form.reset();
      toast({
        title: 'Success!',
        description: `The quiz "${values.title}" has been added successfully.`,
      });
    } catch (error) {
      console.error("Error processing form:", error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem creating the quiz.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <BrainCircuit className="mr-2 h-4 w-4" /> Add Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Quiz</DialogTitle>
          <DialogDescription>Build an interactive quiz for students with questions, options, and a time limit.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger></FormControl>
                            <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger></FormControl>
                            <SelectContent>{subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Quiz Title</FormLabel><FormControl><Input placeholder="E.g., Algebra Basics" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Quiz Description</FormLabel><FormControl><Textarea placeholder="A short summary of what this quiz covers." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="priceInr" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Price (INR)</FormLabel>
                        <div className="relative">
                            <FormControl><Input type="number" {...field} className="pl-8" /></FormControl>
                            <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="timeLimit" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Time Limit (minutes)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
            
            <Separator />

            <div>
                <h3 className="text-lg font-medium mb-4">Questions</h3>
                 <div className="space-y-6">
                    {fields.map((field, index) => (
                        <div key={field.id} className="rounded-lg border p-4 space-y-4 relative bg-secondary/30">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-base">Question {index + 1}</FormLabel>
                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove Question</span>
                                </Button>
                            </div>
                             <FormField control={form.control} name={`questions.${index}.question`} render={({ field }) => (
                                <FormItem><FormLabel>Question Text</FormLabel><FormControl><Textarea {...field} placeholder="What is 2 + 2?" /></FormControl><FormMessage /></FormItem>
                            )}/>
                            
                            <FormField control={form.control} name={`questions.${index}.correctAnswer`} render={({ field: radioField }) => (
                                <FormItem>
                                    <FormLabel>Options (select the correct answer)</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={radioField.onChange} defaultValue={radioField.value?.toString()} className="space-y-2">
                                            {[0, 1, 2, 3].map(optionIndex => (
                                                <div key={optionIndex} className="flex items-center gap-3">
                                                    <RadioGroupItem value={optionIndex.toString()} id={`q${index}-o${optionIndex}`} />
                                                    <FormField control={form.control} name={`questions.${index}.options.${optionIndex}`} render={({ field }) => (
                                                        <FormItem className="flex-1"><FormControl><Input {...field} placeholder={`Option ${optionIndex + 1}`} /></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                    ))}
                </div>
                 <Button type="button" variant="outline" className="mt-4" onClick={() => append({ id: uuidv4(), question: '', options: ['', '', '', ''], correctAnswer: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                </Button>
                <FormField control={form.control} name="questions" render={({ field }) => <FormMessage className="mt-2" />} />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Saving Quiz...' : 'Save Quiz'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
