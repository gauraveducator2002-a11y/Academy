
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogOut } from 'lucide-react';

interface SessionExpiredDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export function SessionExpiredDialog({
  isOpen,
  onConfirm,
}: SessionExpiredDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <LogOut className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
          <AlertDialogTitle className="text-center">Session Ended</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your session has ended because this account was signed into from another device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm} className="w-full">
            Return to Login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
