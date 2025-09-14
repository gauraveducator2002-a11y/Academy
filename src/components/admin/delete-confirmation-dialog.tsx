'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: string;
  itemName: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <VisuallyHidden>
             <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          </VisuallyHidden>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the{' '}
            <span className="font-semibold">{itemType}</span> titled &quot;
            <span className="font-semibold">{itemName}</span>&quot; and remove its data from
            our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
