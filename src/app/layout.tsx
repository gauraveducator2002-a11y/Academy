
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ContentProvider, ContentContext, type Notification } from '@/context/content-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  UserCog,
  ChevronDown,
  CreditCard,
  MessagesSquare,
  Search,
  Settings,
  Bell,
  BellDot,
  History,
  Loader2,
} from 'lucide-react';
import { getAuth, sendPasswordResetEmail, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useState, useEffect, useContext, useCallback } from 'react';
import { useFirestoreDocument } from '@/hooks/use-firestore';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { LogoutFeedbackDialog } from '@/components/student/logout-feedback-dialog';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog';
import { v4 as uuidv4 } from 'uuid';
import { UserSessionSchema } from '@/context/content-context';


const auth = getAuth(app);


function NotificationCenter() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useContext(ContentContext);
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.read).length;
  const sortedNotifications = [...notifications].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    router.push(`/class/${notification.classId}/${notification.subjectId}`);
  };

  return (
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  {unreadCount > 0 ? <BellDot className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  <span className="sr-only">Toggle notifications</span>
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortedNotifications.length > 0 ? (
                <>
                  <div className="max-h-80 overflow-y-auto">
                    {sortedNotifications.map(n => (
                        <DropdownMenuItem key={n.id} onClick={() => handleNotificationClick(n)} className={cn("flex flex-col items-start gap-1 whitespace-normal", !n.read && "bg-secondary")}>
                            <div className="font-semibold">{n.title}</div>
                            <p className="text-xs text-muted-foreground">{n.message}</p>
                            <p className="text-xs text-muted-foreground/80 mt-1">{formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}</p>
                        </DropdownMenuItem>
                    ))}
                  </div>
                  {unreadCount > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={markAllNotificationsAsRead}>Mark all as read</DropdownMenuItem>
                      </>
                  )}
                </>
              ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
              )}
          </DropdownMenuContent>
      </DropdownMenu>
  );
}


function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogoutFeedbackOpen, setIsLogoutFeedbackOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { addFeedback, loading } = useContext(ContentContext);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Session management logic
  const { data: remoteSession, updateData: updateRemoteSession, deleteDoc: deleteRemoteSession } = useFirestoreDocument('sessions', userId, UserSessionSchema);

  const startUserSession = useCallback(async (userId: string) => {
    if (typeof window === 'undefined') return;
    const sessionId = uuidv4();
    localStorage.setItem('session_id', sessionId);
    await updateRemoteSession({ 
      activeSessionId: sessionId, 
      lastLogin: new Date() 
    });
  }, [updateRemoteSession]);

  const endUserSession = useCallback(async () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('session_id');
    if (userId) {
        await deleteRemoteSession();
    }
  }, [deleteRemoteSession, userId]);

 useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserId(currentUser?.uid);
      setHasMounted(true);

      if (currentUser) {
        // User is logged in
        const localSessionId = localStorage.getItem('session_id');
        if (!localSessionId) {
          // This is a fresh login, start a new session.
          startUserSession(currentUser.uid);
        }
      } else {
        // User is logged out
        if (!['/', '/forgot-password'].includes(pathname)) {
          router.push('/');
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router, startUserSession]);

  useEffect(() => {
    if (hasMounted && user && remoteSession) {
      const localSessionId = localStorage.getItem('session_id');
      if (localSessionId && remoteSession.activeSessionId && remoteSession.activeSessionId !== localSessionId) {
        setIsSessionExpired(true);
      }
    }
  }, [user, remoteSession, hasMounted]);
  
  const isAdmin = user?.email === 'gauraveducator2002@gmail.com';

  const handleAdminLogout = useCallback(() => {
    endUserSession().then(() => {
        signOut(auth).catch(error => console.error("Admin sign out failed:", error));
    });
    router.push('/');
  }, [endUserSession, router]);

  const handleLogoutClick = () => {
    if (isAdmin) {
      handleAdminLogout();
    } else {
      setIsLogoutFeedbackOpen(true);
    }
  };

  const handleFinalLogout = useCallback(() => {
    setIsLogoutFeedbackOpen(false);
    endUserSession().then(() => {
        signOut(auth).catch(error => console.error("Sign out failed:", error));
    }).catch(error => {
        console.error("endUserSession failed:", error);
        signOut(auth).catch(error => console.error("Sign out failed on error path:", error));
    });
    router.push('/');
  }, [endUserSession, router]);


  const handleFeedbackAndLogout = useCallback(async (details: { studentName: string; feedback: string; suggestion: string; rating: number; }) => {
    addFeedback(details);
    toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for your valuable input. Logging you out...',
    });
    handleFinalLogout();
  }, [addFeedback, handleFinalLogout, toast]);

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

   const handleSessionExpiredConfirm = async () => {
    setIsSessionExpired(false);
    localStorage.removeItem('session_id');
    await signOut(auth); 
    router.push('/');
  };
  
  const isAuthPage = ['/', '/forgot-password'].includes(pathname);
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground p-1">
              <Logo className="h-8 w-8 text-primary" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground font-headline">Growth Academy</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {!isAdmin && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/quiz-history')}
                    tooltip="Quiz History"
                  >
                    <Link href="/quiz-history">
                      <History />
                      <span>Quiz History</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/feedback')}
                    tooltip="Community Feedback"
                  >
                    <Link href="/feedback">
                      <MessagesSquare />
                      <span>Community Feedback</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
              <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/settings')}
                tooltip="Settings"
              >
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin')}
                    tooltip="Admin"
                  >
                    <Link href="/admin">
                      <UserCog />
                      <span>Admin Section</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin/payments')}
                    tooltip="Payments"
                  >
                    <Link href="/admin/payments">
                      <CreditCard />
                      <span>Payments</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogoutClick} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex-1">
                {hasMounted && <SidebarTrigger className="md:hidden" />}
            </div>
            <form>
                <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search content..."
                    className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
             {hasMounted && (
               <>
                {!isAdmin && <NotificationCenter />}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 rounded-full p-1 focus-visible:ring-0"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src="https://picsum.photos/seed/user/100/100"
                          alt="User Avatar"
                          data-ai-hint="person avatar"
                        />
                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="hidden text-sm font-medium md:inline">
                        {user?.email || 'User'}
                      </span>
                      <ChevronDown className="hidden h-4 w-4 md:inline" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleResetPassword}>Reset Password</DropdownMenuItem>
                    <DropdownMenuItem disabled>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogoutClick}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
      {!isAdmin && (
        <LogoutFeedbackDialog
            isOpen={isLogoutFeedbackOpen}
            onClose={() => setIsLogoutFeedbackOpen(false)}
            onFeedbackSubmit={handleFeedbackAndLogout}
            onSkip={handleFinalLogout}
        />
      )}
        <SessionExpiredDialog 
            isOpen={isSessionExpired}
            onConfirm={handleSessionExpiredConfirm}
        />
    </SidebarProvider>
  );
}


function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme } = useContext(ContentContext);
  return (
    <html lang="en" className={theme} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppContent>{children}</AppContent>
        <Toaster />
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <ContentProvider>
      <RootLayoutContent>{children}</RootLayoutContent>
    </ContentProvider>
  );
}
