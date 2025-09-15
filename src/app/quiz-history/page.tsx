
'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { ContentContext } from '@/context/content-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import { format } from 'date-fns';

export default function QuizHistoryPage() {
  const { quizAttempts, contentData } = useContext(ContentContext);

  const sortedAttempts = [...quizAttempts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getQuizDetails = (quizId: string) => {
    for (const subjectKey in contentData) {
      const quiz = contentData[subjectKey].quizzes.find(q => q.id === quizId);
      if (quiz) return quiz;
    }
    return null;
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <History /> Quiz History
          </h1>
          <p className="text-muted-foreground">
            Review your past quiz attempts from all subjects.
          </p>
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All Attempts</CardTitle>
          <CardDescription>{sortedAttempts.length} total quiz attempts recorded.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedAttempts.length > 0 ? (
            <ul className="space-y-4">
              {sortedAttempts.map(attempt => {
                const quiz = getQuizDetails(attempt.quizId);
                return (
                  <li key={attempt.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{quiz?.title || 'Unknown Quiz'}</p>
                      <p className="text-sm text-muted-foreground">
                        Attempted by {attempt.studentName} on {format(new Date(attempt.timestamp), 'PPpp')}
                      </p>
                       <p className="text-sm text-muted-foreground">
                        Subject: {quiz ? (quiz.subjectId.charAt(0).toUpperCase() + quiz.subjectId.slice(1).replace('-', ' ')) : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{attempt.score}/{quiz?.questions.length}</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                      <Button asChild variant="outline">
                        <Link href={`/quiz/result/${attempt.id}`}>View Result</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">No Quiz Attempts Yet</p>
              <p className="text-sm text-muted-foreground">Your past quiz scores will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
