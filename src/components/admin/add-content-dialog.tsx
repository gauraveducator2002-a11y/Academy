
'use client';

import * as React from 'react';
import { useState, useContext } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { PlusCircle, Loader2, IndianRupee, ClipboardList } from 'lucide-react';
import { ContentContext } from '@/context/content-context';

const noteSchema = z.object({
  classId: z.string({ required_error: 'Please select a class.' }),
  subjectId: z.string({ required_error: 'Please select a subject.' }),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(3, 'Description must be at least 3 characters.'),
  priceInr: z.coerce.number().min(0, 'Price must be a positive number.'),
  file: z.any().refine((files) => files?.length === 1, 'File is required.'),
});

const testSchema = z.object({
  classId: z.string({ required_error: 'Please select a class.' }),
  subjectId: z.string({ required_error: 'Please select a subject.' }),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(3, 'Description must be at least 3 characters.'),
  priceInr: z.coerce.number().min(0, 'Price must be a positive number.'),
  testFile: z.any().refine((files) => files?.length === 1, 'Test file is required.'),
  answerFile: z.any().refine((files) => files?.length === 1, 'Answer file is required.'),
});


const schemas = {
  note: noteSchema,
  test: testSchema,
};

const titles = {
  note: 'Add New Note',
  test: 'Add New Subjective Test',
};

const descriptions = {
  note: 'Upload a new PDF note for a specific class and subject.',
  test: 'Upload a test paper and its corresponding answer key.',
};

type ContentType = 'note' | 'test';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const icon = {
  note: <PlusCircle className="mr-2 h-4 w-4" />,
  test: <ClipboardList className="mr-2 h-4 w-4" />
}

export function AddContentDialog({ contentType, onContentAdded }: { contentType: ContentType, onContentAdded: (type: ContentType, data: any) => void; }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { pricing } = useContext(ContentContext);

  const defaultValues = {
    note: { classId: '', subjectId: '', title: '', description: '', priceInr: pricing.notePriceInr, file: undefined },
    test: { classId: '', subjectId: '', title: '', description: '', priceInr: pricing.quizPriceInr, testFile: undefined, answerFile: undefined },
  };

  const form = useForm({
    resolver: zodResolver(schemas[contentType]),
    defaultValues: defaultValues[contentType]
  });

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      const dataToSubmit: any = { ...values };

      if (contentType === 'note' && values.file?.[0]) {
        dataToSubmit.fileUrl = await fileToBase64(values.file[0]);
        delete dataToSubmit.file;
      }
      if (contentType === 'test') {
        if (values.testFile?.[0]) {
            dataToSubmit.testFileUrl = await fileToBase64(values.testFile[0]);
            delete dataToSubmit.testFile;
        }
        if (values.answerFile?.[0]) {
            dataToSubmit.answerFileUrl = await fileToBase64(values.answerFile[0]);
            delete dataToSubmit.answerFile;
        }
      }
      
      onContentAdded(contentType, dataToSubmit);
      setOpen(false);
      form.reset(defaultValues[contentType]);
      toast({
        title: 'Success!',
        description: `The ${contentType} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error processing form:", error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem processing your request.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        form.reset(defaultValues[contentType]);
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          {icon[contentType]} Add {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titles[contentType]}</DialogTitle>
          <DialogDescription>{descriptions[contentType]}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
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
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${contentType} title`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${contentType} description`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             
            {contentType === 'note' && (
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PDF File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {contentType === 'test' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="testFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Paper File (PDF)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => field.onChange(e.target.files)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="answerFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answer Key File (PDF)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => field.onChange(e.target.files)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="priceInr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (INR)</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Input type="number" placeholder="830" {...field} className="pl-8" />
                    </FormControl>
                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
