'use client';

import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function FloatingFeedbackButton({ onClick }: { onClick: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
            <Button
            onClick={onClick}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
            size="icon"
            >
            <MessageSquarePlus className="h-6 w-6" />
            <span className="sr-only">Give Feedback</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
            <p>Give Feedback</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
