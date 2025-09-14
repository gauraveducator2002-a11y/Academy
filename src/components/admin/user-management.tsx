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
import { Loader2, PlusCircle, Users, RefreshCw, Clipboard } from 'lucide-react';
import { ContentContext } from '@/context/content-context';
import { classes } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createFirebaseUser } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters.')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    classId: z.string({ required_error: 'Please select a class for the student.' }),
});

const generatePassword = () => {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};

export function UserManagement() {
    const { studentUsers, addStudentUser } = useContext(ContentContext);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [creationError, setCreationError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: '',
            password: '',
            classId: '',
        },
    });

    const handleGenerateCredentials = () => {
        const username = `student${Date.now().toString().slice(-5)}`;
        const password = generatePassword();
        form.setValue('username', username);
        form.setValue('password', password);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: 'Credentials copied to clipboard.',
        });
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setCreationError(null);

        const email = `${values.username}@growth.academy`;
        const result = await createFirebaseUser(email, values.password);

        if (result.success) {
            addStudentUser({ 
                username: values.username, 
                email: email, 
                classId: values.classId 
            });
            toast({
                title: 'Success!',
                description: `Student account for "${values.username}" has been created.`,
            });
            form.reset({ username: '', password: '', classId: ''});
        } else {
            console.error("Firebase user creation error:", result.error);
            let errorMessage = "An unknown error occurred.";
            if (result.error?.code === 'auth/email-already-in-use') {
                errorMessage = "This username is already taken. Please choose a different one or generate new credentials.";
            } else if (result.error?.code === 'auth/weak-password') {
                errorMessage = "The password is too weak. It must be at least 6 characters long.";
            } else if (result.error?.code === 'auth/invalid-email') {
                errorMessage = "The generated email is invalid. Please check the username for special characters."
            }
            setCreationError(errorMessage);
        }
        setIsLoading(false);
    }
    
    return (
        <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Users />User Management</h2>
            <p className="text-sm text-muted-foreground">Create and manage student login accounts.</p>
            
            <div className="mt-4 grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Student Account</CardTitle>
                        <CardDescription>Manually enter or generate credentials for a new student.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {creationError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Creation Failed</AlertTitle>
                                        <AlertDescription>{creationError}</AlertDescription>
                                    </Alert>
                                )}
                                
                                <Button type="button" variant="outline" className="w-full" onClick={handleGenerateCredentials}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Generate Credentials
                                </Button>

                                <FormField control={form.control} name="username" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl><Input placeholder="E.g., student123" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl><Input placeholder="Enter a secure password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                {form.getValues('username') && form.getValues('password') && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => copyToClipboard(`Username: ${form.getValues('username')}\nPassword: ${form.getValues('password')}`)}
                                    >
                                        <Clipboard className="mr-2 h-4 w-4" />
                                        Copy Credentials
                                    </Button>
                                )}

                                 <FormField control={form.control} name="classId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign to Class</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger></FormControl>
                                            <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    Create Account
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Students</CardTitle>
                        <CardDescription>A list of all created student accounts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Class</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentUsers.length > 0 ? (
                                    studentUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>Class {user.classId}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No student accounts created yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
