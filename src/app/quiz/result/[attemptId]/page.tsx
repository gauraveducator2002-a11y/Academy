
'use client';

import { useContext } from 'react';
import { useParams } from 'next/navigation';
import { ContentContext } from '@/context/content-context';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Home, Clock, Trophy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Quiz } from '@/context/content-context';

export default function ResultPage() {
    const params = useParams();
    const attemptId = Array.isArray(params.attemptId) ? params.attemptId[0] : params.attemptId;
    const { quizAttempts, contentData } = useContext(ContentContext);

    const attempt = quizAttempts.find(a => a.id === attemptId);

    if (!attempt) {
        return notFound();
    }
    
    const quiz: Quiz | null | undefined = Object.values(contentData)
        .flatMap(classContent => Object.values(classContent))
        .flatMap(subjectContent => subjectContent.quizzes)
        .find(q => q.id === attempt.quizId);

    if (!quiz) {
        return notFound();
    }

    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
    const timeTakenFormatted = `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s`;

    const getScoreColor = () => {
        if (percentage >= 80) return 'text-green-500';
        if (percentage >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Card className="shadow-lg">
                <CardHeader className="text-center">
                    <Trophy className={`mx-auto h-16 w-16 ${getScoreColor()}`} />
                    <CardTitle className="text-3xl mt-4">Quiz Results</CardTitle>
                    <CardDescription className="text-lg">{quiz.title}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center my-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className={getScoreColor()}>{percentage}%</CardTitle>
                                <CardDescription>Your Score</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>{attempt.score}/{attempt.totalQuestions}</CardTitle>
                                <CardDescription>Correct Answers</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-center gap-2"><Clock className="h-6 w-6"/>{timeTakenFormatted}</CardTitle>
                                <CardDescription>Time Taken</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                    
                    <Separator className="my-8" />

                    <h3 className="text-2xl font-semibold mb-6">Review Your Answers</h3>
                    <div className="space-y-8">
                        {quiz.questions.map((question, index) => {
                            const studentAnswerIndex = attempt.answers[index];
                            const correctAnswerIndex = question.correctAnswer;
                            const isCorrect = studentAnswerIndex === correctAnswerIndex;
                            const studentAnswerText = studentAnswerIndex !== -1 ? question.options[studentAnswerIndex] : "Not Answered";

                            return (
                                <div key={question.id}>
                                    <p className="font-semibold text-lg flex items-start gap-2">
                                         <span className="text-muted-foreground">{index + 1}.</span> 
                                         <span>{question.question}</span>
                                    </p>
                                    <div className="mt-4 space-y-2 pl-6">
                                        <p className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold w-24">Your Answer:</span>
                                            {isCorrect ? (
                                                 <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                 <XCircle className="h-5 w-5 text-red-500" />
                                            )}
                                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{studentAnswerText}</span>
                                        </p>
                                        {!isCorrect && (
                                             <p className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold w-24">Correct Answer:</span>
                                                <CheckCircle className="h-5 w-5 text-primary" />
                                                <span className="text-primary">{question.options[correctAnswerIndex]}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
                <CardFooter className="justify-center gap-2">
                    <Button asChild>
                        <Link href={`/class/${quiz.classId}/${quiz.subjectId}`}>
                            <Home className="mr-2"/> Back to Subject
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
