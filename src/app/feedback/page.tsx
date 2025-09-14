'use client';

import { useContext, useState } from 'react';
import { ContentContext } from '@/context/content-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Lightbulb, MessageCircle, MessageSquarePlus, Star, User } from 'lucide-react';
import { FeedbackDialog } from '@/components/student/feedback-dialog';
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

export default function FeedbackPage() {
  const { feedback, addFeedback } = useContext(ContentContext);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const sortedFeedback = [...feedback].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleFeedbackSubmit = (details: { studentName: string; feedback: string; suggestion: string; rating: number }) => {
    addFeedback(details);
    setIsFeedbackDialogOpen(false);
  };
  
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Community Feedback</h1>
          <p className="text-muted-foreground">
            See what other students are saying and share your own thoughts.
          </p>
        </div>
        <Button onClick={() => setIsFeedbackDialogOpen(true)}>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Give Feedback
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>{sortedFeedback.length} total submissions from the community.</CardDescription>
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-[60vh]">
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
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold">No Feedback Yet</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to share your thoughts!
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
       <FeedbackDialog
        isOpen={isFeedbackDialogOpen}
        onClose={() => setIsFeedbackDialogOpen(false)}
        onFeedbackSubmit={handleFeedbackSubmit}
      />
    </>
  );
}
