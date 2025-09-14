'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { classes } from '@/lib/data';
import { ArrowRight, MessageCircle, Lightbulb, MessagesSquare, User, Star, MessageSquarePlus } from 'lucide-react';
import { useContext, useState } from 'react';
import { ContentContext } from '@/context/content-context';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FeedbackDialog } from '@/components/student/feedback-dialog';

const StarRating = ({ rating, className }: { rating: number, className?: string }) => (
  <div className={cn("flex items-center gap-0.5", className)}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={cn(
          'h-3 w-3',
          rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
        )}
      />
    ))}
  </div>
);

export default function DashboardPage() {
    const { feedback, addFeedback } = useContext(ContentContext);
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
    
    const recentFeedback = [...feedback]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
        
    const handleFeedbackSubmit = (details: { studentName: string; feedback: string; suggestion: string; rating: number }) => {
      addFeedback(details);
      setIsFeedbackDialogOpen(false);
    };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome, Student!</h1>
            <p className="text-muted-foreground">Please select your class to proceed.</p>
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {classes.map((c) => (
          <Link href={`/class/${c.id}`} key={c.id}>
            <Card className="group transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{c.name}</CardTitle>
                  <CardDescription>View subjects and materials</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
        <div className="mt-12">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight font-headline flex items-center gap-2">
                        <MessagesSquare /> Community Feedback
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Here&apos;s what other students are talking about.
                    </p>
                </div>
                <Button onClick={() => setIsFeedbackDialogOpen(true)}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    Give Feedback
                </Button>
            </div>
            <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentFeedback.length > 0 ? (
                recentFeedback.map(item => (
                    <Card key={item.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-semibold text-sm">{item.studentName}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <StarRating rating={item.rating} />
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {item.feedback && (
                                <div>
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2 mb-1"><MessageCircle className="h-3 w-3" />Feedback</h4>
                                    <p className="text-sm line-clamp-3">{item.feedback}</p>
                                </div>
                            )}
                            {item.suggestion && (
                                <div className={`${item.feedback ? 'mt-4' : ''}`}>
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2 mb-1"><Lightbulb className="h-3 w-3" />Suggestion</h4>
                                    <p className="text-sm line-clamp-3">{item.suggestion}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            ) : (
                 <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No community feedback yet. Be the first to share!</p>
                </div>
            )}
            </div>
            <div className="mt-6 flex justify-center">
                 <Button asChild variant="outline">
                    <Link href="/feedback">View All Feedback</Link>
                </Button>
            </div>
        </div>
         <FeedbackDialog
            isOpen={isFeedbackDialogOpen}
            onClose={() => setIsFeedbackDialogOpen(false)}
            onFeedbackSubmit={handleFeedbackSubmit}
        />
    </>
  );
}
