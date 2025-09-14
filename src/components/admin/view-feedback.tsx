'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Feedback } from '@/context/content-context';
import { formatDistanceToNow } from 'date-fns';
import { MessagesSquare, User, MessageCircle, Lightbulb, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRating = ({ rating, className }: { rating: number, className?: string }) => (
  <div className={cn("flex items-center gap-0.5", className)}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={cn(
          'h-4 w-4',
          rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
        )}
      />
    ))}
  </div>
);

export function ViewFeedback({ feedback }: { feedback: Feedback[] }) {
  const sortedFeedback = [...feedback].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
        <MessagesSquare /> Student Feedback & Suggestions
      </h2>
      <p className="text-sm text-muted-foreground">
        Review feedback submitted by students.
      </p>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Feedback Inbox</CardTitle>
          <CardDescription>
            {sortedFeedback.length} total submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72">
            {sortedFeedback.length > 0 ? (
              <div className="space-y-6 p-1">
                {sortedFeedback.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border bg-secondary/30">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="font-semibold text-sm">{item.studentName}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <StarRating rating={item.rating} />
                           <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                           </p>
                        </div>
                    </div>
                    {item.feedback && (
                        <div className="mt-4">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2 mb-1"><MessageCircle className="h-3 w-3" />Feedback</h4>
                            <p className="text-sm">{item.feedback}</p>
                        </div>
                    )}
                    {item.suggestion && (
                        <div className="mt-4">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2 mb-1"><Lightbulb className="h-3 w-3" />Suggestion</h4>
                            <p className="text-sm">{item.suggestion}</p>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <MessagesSquare className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold">No Feedback Yet</p>
                <p className="text-sm text-muted-foreground">
                  Student feedback and suggestions will appear here.
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

    