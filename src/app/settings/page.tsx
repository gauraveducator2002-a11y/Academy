'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { KeyRound, Moon, Palette, SettingsIcon, Sun, User } from 'lucide-react';
import { useContext } from 'react';
import { ContentContext } from '@/context/content-context';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const auth = getAuth(app);

export default function SettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useContext(ContentContext);

    const handleResetPassword = async () => {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email) {
            try {
                await sendPasswordResetEmail(auth, currentUser.email);
                toast({
                title: 'Password Reset Email Sent',
                description: `A password reset link has been sent to ${currentUser.email}.`,
                });
            } catch (error: any) {
                console.error(error);
                toast({
                variant: 'destructive',
                title: 'An Error Occurred',
                description: error.message || 'Something went wrong. Please try again.',
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Could not send reset email',
                description: 'No authenticated user email found. Please try logging in again.',
            });
        }
    };


  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <SettingsIcon /> Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and security.
        </p>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> Profile</CardTitle>
                <CardDescription>This is your account information.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    <p className="font-semibold">{auth.currentUser?.email?.split('@')[0]}</p>
                    <p className="text-sm text-muted-foreground">{auth.currentUser?.email}</p>
                 </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound /> Security</CardTitle>
                <CardDescription>Manage your password and secure your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleResetPassword}>Send Password Reset Email</Button>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette /> Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <Label htmlFor="theme-switch" className="flex flex-col space-y-1">
                        <span>Theme</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            Switch between light and dark mode.
                        </span>
                    </Label>
                    <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5" />
                        <Switch
                            id="theme-switch"
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                        <Moon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
