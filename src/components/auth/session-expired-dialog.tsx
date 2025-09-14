
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
import { AlertTriangle } from 'lucide-react';

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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
            </div>
          <AlertDialogTitle className="text-center">Session Expired</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your session has been terminated because this account was logged into from another device. Please log in again to continue.
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
