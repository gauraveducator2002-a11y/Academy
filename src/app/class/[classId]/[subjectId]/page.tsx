
'use client';

import { useContext, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { classes, subjects } from '@/lib/data';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Brain, IndianRupee, History, ClipboardList, Loader2, FileText } from 'lucide-react';
import { ContentContext } from '@/context/content-context';
import type { Note, Quiz, Test } from '@/context/content-context';
import { FeesDialog } from '@/components/student/fees-dialog';
import Link from 'next/link';
import { format } from 'date-fns';

const downloadFile = (url: string, title: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/ /g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId;
  const subjectId = Array.isArray(params.subjectId) ? params.subjectId[0] : params.subjectId;
  
  const { contentData, addTransaction, discountCodes, quizAttempts } = useContext(ContentContext);
  
  const currentClass = classes.find((c) => c.id === classId);
  const currentSubject = subjects.find((s) => s.id === subjectId);

  const [isFeesDialogOpen, setIsFeesDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Note | Quiz | Test | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!currentClass || !currentSubject) {
    notFound();
  }
  
  const handleDirectAccess = (content: Note | Quiz | Test) => {
    addTransaction({
      studentName: 'Student',
      amount: 0,
      contentTitle: content.title,
      timestamp: new Date(),
    });

    if ('questions' in content) { // It's a quiz
      router.push(`/quiz/${content.id}?studentName=${encodeURIComponent('Student')}`);
    } else if ('testFileUrl' in content) { // It's a test
      downloadFile(content.testFileUrl, content.title);
    } else { // It's a note
       downloadFile(content.fileUrl, content.title);
    }
  };

  const handlePurchaseClick = (content: Note | Quiz | Test) => {
    setSelectedContent(content);
    if (content.priceInr <= 0) {
      handleDirectAccess(content);
    } else {
      setIsFeesDialogOpen(true);
    }
  };

  const handlePaymentSuccess = (paymentDetails: { studentName: string, amount: number, referenceCode?: string }) => {
    if (selectedContent) {
      addTransaction({
        ...paymentDetails,
        contentTitle: selectedContent.title,
        timestamp: new Date(),
      });
      
      if ('questions' in selectedContent) { // It's a quiz
        router.push(`/quiz/${selectedContent.id}?studentName=${encodeURIComponent(paymentDetails.studentName)}`);
      } else if ('testFileUrl' in selectedContent) { // It's a test
        downloadFile(selectedContent.testFileUrl, selectedContent.title);
      } else { // It's a note
        downloadFile(selectedContent.fileUrl, selectedContent.title);
      }
    }
    setIsFeesDialogOpen(false);
    setSelectedContent(null);
  };

  const content = contentData[classId]?.[subjectId] || { notes: [], quizzes: [], tests: [] };
  const subjectQuizAttempts = quizAttempts.filter(attempt => {
    const quiz = content.quizzes.find(q => q.id === attempt.quizId);
    return quiz?.subjectId === subjectId && quiz?.classId === classId;
  }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!hasMounted || !content) {
    return (
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                {currentClass?.name} - {currentSubject?.name}
            </h1>
            <p className="text-muted-foreground">
                Find all your learning materials here.
            </p>
            <div className="flex items-center justify-center pt-16">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        </div>
    );
  }
  
  return (
    <>
      <div className="space-y-2">
        <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                {currentClass.name} - {currentSubject.name}
              </h1>
              <p className="text-muted-foreground">
                Find all your learning materials here.
              </p>
            </div>
        </div>
      </div>

      <Tabs defaultValue="notes" className="mt-8">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tests">Subjective Tests</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes (MCQ)</TabsTrigger>
          <TabsTrigger value="attempts">Quiz Attempts</TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.notes && content.notes.length > 0 ? (
              content.notes.map((note) => (
                <Card key={note.id} className="flex flex-col h-full transition-shadow duration-300 hover:shadow-lg">
                  <CardHeader className="flex-1">
                    <CardTitle>{note.title}</CardTitle>
                    <CardDescription>{note.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <p className="flex items-center font-semibold text-lg"><IndianRupee className="h-5 w-5" />{note.priceInr.toFixed(2)}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handlePurchaseClick(note)}>
                      <FileText className="mr-2 h-4 w-4" /> {note.priceInr > 0 ? 'Purchase & Download' : 'Download for Free'}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-muted-foreground">No notes available yet.</p>
            )}
          </div>
        </TabsContent>
         <TabsContent value="tests" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.tests && content.tests.length > 0 ? (
              content.tests.map((test) => (
                <Card key={test.id} className="flex flex-col h-full transition-shadow duration-300 hover:shadow-lg">
                  <CardHeader className="flex-1">
                    <CardTitle>{test.title}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <p className="flex items-center font-semibold text-lg"><IndianRupee className="h-5 w-5" />{test.priceInr.toFixed(2)}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handlePurchaseClick(test)}>
                      <ClipboardList className="mr-2 h-4 w-4" /> {test.priceInr > 0 ? 'Purchase & Download' : 'Download for Free'}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-muted-foreground">No subjective tests available yet.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="quizzes" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.quizzes && content.quizzes.length > 0 ? (
              content.quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                     <CardDescription>
                      {quiz.description}
                    </CardDescription>
                  </CardHeader>
                   <CardContent>
                     <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>{quiz.questions.length} Questions</span>
                        <span>{quiz.timeLimit} mins</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <p className="flex items-center font-semibold text-lg"><IndianRupee className="h-5 w-5" />{quiz.priceInr.toFixed(2)}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handlePurchaseClick(quiz)}>
                       <Brain className="mr-2 h-4 w-4" /> {quiz.priceInr > 0 ? 'Take Quiz' : 'Take for Free'}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-muted-foreground">No quizzes available.</p>
            )}
          </div>
        </TabsContent>
         <TabsContent value="attempts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Quiz History</CardTitle>
              <CardDescription>Review your past quiz attempts for this subject.</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectQuizAttempts.length > 0 ? (
                 <ul className="space-y-4">
                  {subjectQuizAttempts.map(attempt => {
                    const quiz = content.quizzes.find(q => q.id === attempt.quizId);
                    return (
                       <li key={attempt.id} className="flex items-center justify-between rounded-lg border p-4">
                         <div>
                           <p className="font-semibold">{quiz?.title || 'Unknown Quiz'}</p>
                           <p className="text-sm text-muted-foreground">
                             Attempted by {attempt.studentName} on {format(new Date(attempt.timestamp), 'PPpp')}
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
                    )
                  })}
                 </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold">No Quiz Attempts Yet</p>
                    <p className="text-sm text-muted-foreground">Your past quiz scores for this subject will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {selectedContent && (
         <FeesDialog
            isOpen={isFeesDialogOpen}
            onClose={() => setIsFeesDialogOpen(false)}
            onPaymentSuccess={handlePaymentSuccess}
            contentTitle={selectedContent.title}
            contentPriceInr={selectedContent.priceInr}
            discountCodes={discountCodes}
        />
      )}
    </>
  );
}
