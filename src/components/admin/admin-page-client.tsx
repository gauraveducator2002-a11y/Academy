
'use client';

import { useContext, useState } from 'react';
import { AddContentDialog } from '@/components/admin/add-content-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FileText, ClipboardList, Award, ExternalLink, Book, Atom, Landmark, Trash2, Pencil, BrainCircuit, History, Users, RefreshCw, Clipboard, MessagesSquare, FileMinus, Calculator, Briefcase } from 'lucide-react';
import { classes, subjects } from '@/lib/data';
import { ContentContext } from '@/context/content-context';
import { formatDistanceToNow } from 'date-fns';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import type { Note, Quiz, QuizAttempt, Test } from '@/context/content-context';
import { AddQuizDialog } from '@/components/admin/add-quiz-dialog';
import Link from 'next/link';
import { UserManagement } from '@/components/admin/user-management';
import { ViewFeedback } from '@/components/admin/view-feedback';

const downloadFile = (url: string, title: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/ /g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const activityIcons = {
  'Added Note': <FileText className="h-5 w-5 text-primary" />,
  'Added Test': <ClipboardList className="h-5 w-5 text-purple-500" />,
  'Added Quiz': <BrainCircuit className="h-5 w-5 text-blue-500" />,
  'Completed Quiz': <Award className="h-5 w-5 text-accent" />,
  'Deleted Note': <FileMinus className="h-5 w-5 text-destructive" />,
  'Deleted Test': <FileMinus className="h-5 w-5 text-destructive" />,
  'Deleted Quiz': <FileMinus className="h-5 w-5 text-destructive" />,
} as const;

const subjectIcons: { [key: string]: React.ReactNode } = {
  mathematics: <Book className="h-6 w-6 text-primary" />,
  science: <Atom className="h-6 w-6 text-primary" />,
  'social-science': <Landmark className="h-6 w-6 text-primary" />,
  accountancy: <Calculator className="h-6 w-6 text-primary" />,
  'business-studies': <Briefcase className="h-6 w-6 text-primary" />,
};


export default function AdminPageClient() {
  const { contentData, addContent, recentActivity, addActivity, deleteContent, quizAttempts, feedback } = useContext(ContentContext);
  const [itemToDelete, setItemToDelete] = useState<{ subjectId: string; type: 'note' | 'quiz' | 'test'; item: Note | Quiz | Test; } | null>(null);

  const handleContentAdded = async (type: 'note' | 'quiz' | 'test', content: any) => {
    try {
      const addedContent = await addContent(content.subjectId, type, content);

      const classInfo = classes.find((c) => c.id === addedContent.classId);
      const subjectInfo = subjects.find((s) => s.id === addedContent.subjectId);
    
      let activityType: keyof typeof activityIcons | undefined;
      let activityTitle: string = addedContent.title;
      
      switch (type) {
        case 'note':
          activityType = 'Added Note';
          break;
        case 'quiz':
          activityType = 'Added Quiz';
          break;
        case 'test':
          activityType = 'Added Test';
          break;
      }
    
      if (activityType && subjectInfo && classInfo) {
        await addActivity({
          type: activityType,
          title: activityTitle,
          subject: subjectInfo.name,
          class: classInfo.id,
          timestamp: new Date(),
          fileUrl: type === 'note' ? addedContent.fileUrl : null,
        });
      }
    } catch (error) {
      console.error("Failed to add content or activity:", error);
    }
  };
  
  const handleDelete = () => {
    if (itemToDelete) {
      deleteContent(itemToDelete.subjectId, itemToDelete.type as 'note' | 'quiz' | 'test', itemToDelete.item.id);
      setItemToDelete(null);
    }
  };

  const openDeleteDialog = (subjectId: string, type: 'note' | 'quiz' | 'test', item: Note | Quiz | Test) => {
    setItemToDelete({ subjectId, type, item });
  };
  
  const tenHoursAgo = new Date();
  tenHoursAgo.setHours(tenHoursAgo.getHours() - 10);
  
  const sortedActivities = [...recentActivity]
    .filter(activity => new Date(activity.timestamp) >= tenHoursAgo);
  
  const subjectsForClass = (classId: string) => {
    if (['11', '12'].includes(classId)) {
      return subjects.filter(s => ['accountancy', 'business-studies', 'mathematics'].includes(s.id));
    }
    return subjects.filter(s => !['accountancy', 'business-studies'].includes(s.id));
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage educational content for all classes.</p>
        </div>
        <div className="flex space-x-2">
          <AddContentDialog contentType="note" onContentAdded={handleContentAdded} />
          <AddContentDialog contentType="test" onContentAdded={handleContentAdded} />
          <AddQuizDialog onQuizAdded={(quiz) => handleContentAdded('quiz', quiz)} />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <UserManagement />

        <ViewFeedback feedback={feedback} />

        <div>
          <h2 className="text-xl font-semibold tracking-tight">Content Control Panel</h2>
          <p className="text-sm text-muted-foreground">View all uploaded content organized by class and subject.</p>
          <Accordion type="multiple" className="mt-4 w-full rounded-lg border">
             {classes.map(c => (
              <AccordionItem value={`class-${c.id}`} key={c.id}>
                <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline">
                  {c.name}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                   <Accordion type="multiple" className="w-full">
                    {subjectsForClass(c.id).map(subject => {
                      const subjectContent = contentData[subject.id];
                      
                      if (!subjectContent) return null;

                      const notesForClass = subjectContent.notes.filter(n => n.classId === c.id);
                      const quizzesForClass = subjectContent.quizzes.filter(q => q.classId === c.id);
                      const testsForClass = subjectContent.tests.filter(t => t.classId === c.id);
                      const hasContent = notesForClass.length > 0 || quizzesForClass.length > 0 || testsForClass.length > 0;

                      if (!hasContent) return null;

                      return (
                        <AccordionItem value={`${c.id}-${subject.id}`} key={subject.id}>
                           <AccordionTrigger className="flex items-center gap-3 text-base font-medium">
                            {subjectIcons[subject.id]} {subject.name}
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-2">
                            {notesForClass.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Notes</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Title</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {notesForClass.map(note => (
                                      <TableRow key={note.id}>
                                        <TableCell>{note.title}</TableCell>
                                        <TableCell>{note.description}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                           <Button variant="outline" size="sm" onClick={() => downloadFile(note.fileUrl, note.title)}>
                                                <ExternalLink className="mr-2 h-4 w-4" /> View
                                            </Button>
                                          <Button variant="outline" size="icon" className="h-9 w-9">
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Modify</span>
                                          </Button>
                                          <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => openDeleteDialog(subject.id, 'note', note)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                             {testsForClass.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-sm mb-2">Subjective Tests</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Title</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {testsForClass.map(test => (
                                      <TableRow key={test.id}>
                                        <TableCell>{test.title}</TableCell>
                                        <TableCell>{test.description}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                           <Button variant="outline" size="sm" onClick={() => downloadFile(test.testFileUrl, `${test.title}_Test`)}>
                                              <ExternalLink className="mr-2 h-4 w-4" /> View Test
                                            </Button>
                                           <Button variant="outline" size="sm" onClick={() => downloadFile(test.answerFileUrl, `${test.title}_Answers`)}>
                                              <ExternalLink className="mr-2 h-4 w-4" /> View Answers
                                            </Button>
                                          <Button variant="outline" size="icon" className="h-9 w-9">
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Modify</span>
                                          </Button>
                                          <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => openDeleteDialog(subject.id, 'test', test)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                            {quizzesForClass.length > 0 && (
                               <div>
                                <h4 className="font-semibold text-sm mb-2 mt-4">Quizzes (MCQ)</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Title</TableHead>
                                      <TableHead>Questions</TableHead>
                                       <TableHead>Time Limit</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {quizzesForClass.map(quiz => (
                                      <TableRow key={quiz.id}>
                                        <TableCell>{quiz.title}</TableCell>
                                        <TableCell>{quiz.questions.length}</TableCell>
                                        <TableCell>{quiz.timeLimit} mins</TableCell>
                                        <TableCell className="text-right space-x-2">
                                          <Button variant="outline" size="icon" className="h-9 w-9">
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Modify</span>
                                          </Button>
                                          <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => openDeleteDialog(subject.id, 'quiz', quiz)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                   </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">A log of recent activities from the last 10 hours.</p>
          <div className="mt-4 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Activity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedActivities.length > 0 ? (
                  sortedActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {activityIcons[activity.type as keyof typeof activityIcons] || <History className="h-5 w-5" />}
                          <span>{activity.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{activity.title}</TableCell>
                      <TableCell>{activity.subject}</TableCell>
                      <TableCell>Class {activity.class}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</TableCell>
                      <TableCell className="text-right">
                        {activity.fileUrl ? (
                          <Button variant="outline" size="sm" onClick={() => downloadFile(activity.fileUrl!, activity.title)}>
                              <ExternalLink className="mr-2 h-4 w-4" /> View
                          </Button>
                        ) : activity.type === 'Completed Quiz' ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/quiz/result/${(quizAttempts.find(a => a.timestamp.getTime() === activity.timestamp.getTime() && a.studentName === 'Student' ) || {id:''}).id}`}>
                               <ExternalLink className="mr-2 h-4 w-4" /> View Result
                            </Link>
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No recent activity in the last 10 hours.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        itemType={itemToDelete?.type || ''}
        itemName={itemToDelete?.item.title || ''}
      />
    </>
  );
}
