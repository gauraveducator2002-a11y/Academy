
'use client';

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ContentContext } from '@/context/content-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, TimerIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Quiz } from '@/context/content-context';

export default function QuizPage() {
    const params = useParams();
    const quizId = Array.isArray(params.quizId) ? params.quizId[0] : params.quizId;
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentName = searchParams.get('studentName') || 'Student';

    const { contentData, addQuizAttempt } = useContext(ContentContext);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const quiz: Quiz | null | undefined = Object.values(contentData)
        .flatMap(classContent => Object.values(classContent))
        .flatMap(subjectContent => subjectContent.quizzes)
        .find(q => q.id === quizId);

    useEffect(() => {
        if (quiz) {
            setTimeLeft(quiz.timeLimit * 60);
            setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
        }
    }, [quiz]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime! <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prevTime! - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, handleSubmit]);
    
    if (!quiz) {
        // Allow some time for context to load
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (value: string) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = parseInt(value, 10);
        setSelectedAnswers(newAnswers);
    };

    async function handleSubmit(autoSubmit: boolean = false) {
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        let score = 0;
        quiz.questions.forEach((q, index) => {
            if (selectedAnswers[index] === q.correctAnswer) {
                score++;
            }
        });
        
        const attempt = await addQuizAttempt({
            quizId: quiz.id,
            studentName,
            score,
            totalQuestions: quiz.questions.length,
            timestamp: new Date(),
            answers: selectedAnswers,
            timeTaken: (quiz.timeLimit * 60) - (timeLeft || 0),
        });

        router.push(`/quiz/result/${attempt.id}`);
    };

    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{quiz.title}</CardTitle>
                            <CardDescription>{quiz.description}</CardDescription>
                        </div>
                         {timeLeft !== null && (
                             <div className="flex items-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-3 py-1.5 font-semibold text-sm">
                                <TimerIcon className="h-5 w-5" />
                                <span>{formatTime(timeLeft)}</span>
                            </div>
                        )}
                    </div>
                     <Progress value={progress} className="mt-4" />
                </CardHeader>
                <CardContent className="min-h-[300px]">
                    <h3 className="font-semibold text-xl mb-4">Question {currentQuestionIndex + 1} of {quiz.questions.length}</h3>
                    <p className="text-lg mb-6">{currentQuestion.question}</p>
                    
                     <RadioGroup 
                        value={selectedAnswers[currentQuestionIndex]?.toString()} 
                        onValueChange={handleAnswerChange}
                        className="space-y-3"
                    >
                        {currentQuestion.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-3 rounded-md border p-4 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <RadioGroupItem value={index.toString()} id={`q${currentQuestionIndex}-o${index}`} />
                                <Label htmlFor={`q${currentQuestionIndex}-o${index}`} className="text-base flex-1 cursor-pointer">{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>

                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button 
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        disabled={currentQuestionIndex === 0}
                    >
                        <ArrowLeft className="mr-2" /> Previous
                    </Button>
                    
                    {!isLastQuestion ? (
                        <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
                            Next <ArrowRight className="ml-2" />
                        </Button>
                    ) : (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="default" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</> : <><CheckCircle className="mr-2"/> Submit Quiz</>}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Ready to Submit?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to finish the quiz? You cannot change your answers after submitting.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Review Answers</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleSubmit(false)}>Confirm Submission</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
