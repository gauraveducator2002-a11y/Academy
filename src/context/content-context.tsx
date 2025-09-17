
'use client';

import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { classes, subjects } from '@/lib/data';
import { useFirestoreCollection, useFirestoreDocument, useTheme } from '@/hooks/use-firestore';

// Zod Schemas for validation
const NoteSchema = z.object({ id: z.string(), classId: z.string(), subjectId: z.string(), title: z.string(), description: z.string(), fileUrl: z.string(), priceInr: z.number() });
const TestSchema = z.object({ id: z.string(), classId: z.string(), subjectId: z.string(), title: z.string(), description: z.string(), testFileUrl: z.string(), answerFileUrl: z.string(), priceInr: z.number() });
const QuizQuestionSchema = z.object({ id: z.string(), question: z.string(), options: z.array(z.string()), correctAnswer: z.number() });
const QuizSchema = z.object({ id: z.string(), classId: z.string(), subjectId: z.string(), title: z.string(), description: z.string(), priceInr: z.number(), questions: z.array(QuizQuestionSchema), timeLimit: z.number() });
const QuizAttemptSchema = z.object({ id: z.string(), quizId: z.string(), studentName: z.string(), score: z.number(), totalQuestions: z.number(), timestamp: z.date(), answers: z.array(z.number()), timeTaken: z.number() });
const ActivitySchema = z.object({ id: z.string(), type: z.string(), title: z.string(), subject: z.string(), class: z.string(), timestamp: z.date(), fileUrl: z.string().nullable() });
const TransactionSchema = z.object({ id: z.string(), studentName: z.string(), contentTitle: z.string(), amount: z.number(), referenceCode: z.string().optional(), timestamp: z.date() });
const DiscountCodeSchema = z.object({ id: z.string(), code: z.string(), discount: z.number() });
const PricingSchema = z.object({ notePriceInr: z.number(), quizPriceInr: z.number() });
const StudentUserSchema = z.object({ id: z.string(), username: z.string(), email: z.string(), classId: z.string() });
const FeedbackSchema = z.object({ id: z.string(), studentName: z.string(), feedback: z.string(), suggestion: z.string(), rating: z.number(), timestamp: z.date() });
const NotificationSchema = z.object({ id: z.string(), title: z.string(), message: z.string(), timestamp: z.date(), read: z.boolean(), classId: z.string(), subjectId: z.string() });
export const UserSessionSchema = z.object({ activeSessionId: z.string(), lastLogin: z.date() });

// Collection Schemas
const NotesCollectionSchema = z.array(NoteSchema);
const QuizzesCollectionSchema = z.array(QuizSchema);
const TestsCollectionSchema = z.array(TestSchema);
const ActivitiesCollectionSchema = z.array(ActivitySchema);
const TransactionsCollectionSchema = z.array(TransactionSchema);
const DiscountCodesCollectionSchema = z.array(DiscountCodeSchema);
const QuizAttemptsCollectionSchema = z.array(QuizAttemptSchema);
const StudentUsersCollectionSchema = z.array(StudentUserSchema);
const FeedbackCollectionSchema = z.array(FeedbackSchema);
const NotificationsCollectionSchema = z.array(NotificationSchema);

// Types
export type Note = z.infer<typeof NoteSchema>;
export type Test = z.infer<typeof TestSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type DiscountCode = z.infer<typeof DiscountCodeSchema>;
export type Pricing = z.infer<typeof PricingSchema>;
export type StudentUser = z.infer<typeof StudentUserSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type Theme = 'light' | 'dark';
export type Notification = z.infer<typeof NotificationSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;

export type SubjectContent = {
  notes: Note[];
  quizzes: Quiz[];
  tests: Test[];
};

export type ClassContent = Record<string, SubjectContent>;
export type ContentData = Record<string, ClassContent>;

const initialPricing: Pricing = { notePriceInr: 830, quizPriceInr: 1245 };

const initialContentData = classes.reduce((acc, c) => {
    acc[c.id] = subjects.reduce((subAcc, s) => {
        subAcc[s.id] = { notes: [], quizzes: [], tests: [] };
        return subAcc;
    }, {} as ClassContent);
    return acc;
}, {} as ContentData);


type ContentContextType = {
  contentData: ContentData;
  recentActivity: Activity[];
  transactions: Transaction[];
  discountCodes: DiscountCode[];
  pricing: Pricing;
  quizAttempts: QuizAttempt[];
  studentUsers: StudentUser[];
  feedback: Feedback[];
  theme: Theme;
  notifications: Notification[];
  setTheme: (theme: Theme) => void;
  addContent: (type: 'note' | 'quiz' | 'test', data: any) => Promise<any>;
  deleteContent: (subjectId: string, type: 'note' | 'quiz' | 'test', id: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<any>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<any>;
  addDiscountCode: (code: Omit<DiscountCode, 'id'>) => Promise<any>;
  updateDiscountCode: (code: DiscountCode) => Promise<void>;
  deleteDiscountCode: (id: string) => Promise<void>;
  setPricing: (pricing: Pricing) => Promise<void>;
  addQuizAttempt: (attempt: Omit<QuizAttempt, 'id'>) => Promise<QuizAttempt>;
  addStudentUser: (user: Omit<StudentUser, 'id'>) => Promise<any>;
  addFeedback: (feedback: Omit<Feedback, 'id' | 'timestamp'>) => Promise<any>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<any>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
};

export const ContentContext = createContext<ContentContextType>({
  contentData: initialContentData,
  recentActivity: [],
  transactions: [],
  discountCodes: [],
  pricing: initialPricing,
  quizAttempts: [],
  studentUsers: [],
  feedback: [],
  theme: 'light',
  notifications: [],
  setTheme: () => {},
  addContent: async () => {},
  deleteContent: async () => {},
  addActivity: async () => {},
  addTransaction: async () => {},
  addDiscountCode: async () => {},
  updateDiscountCode: async () => {},
  deleteDiscountCode: async () => {},
  setPricing: async () => {},
  addQuizAttempt: async () => ({} as QuizAttempt),
  addStudentUser: async () => {},
  addFeedback: async () => {},
  addNotification: async () => {},
  markNotificationAsRead: async () => {},
  markAllNotificationsAsRead: async () => {},
});

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const { data: notes, addItem: addNote, deleteItem: deleteNote } = useFirestoreCollection('notes', NotesCollectionSchema);
  const { data: quizzes, addItem: addQuiz, deleteItem: deleteQuiz } = useFirestoreCollection('quizzes', QuizzesCollectionSchema);
  const { data: tests, addItem: addTest, deleteItem: deleteTest } = useFirestoreCollection('tests', TestsCollectionSchema);
  const { data: recentActivity, addItem: addActivityFirestore } = useFirestoreCollection('recentActivity', ActivitiesCollectionSchema);
  const { data: transactions, addItem: addTransactionFirestore } = useFirestoreCollection('transactions', TransactionsCollectionSchema);
  const { data: discountCodes, addItem: addDiscountCodeFirestore, updateItem: updateDiscountCode, deleteItem: deleteDiscountCode } = useFirestoreCollection('discountCodes', DiscountCodesCollectionSchema);
  const { data: pricingData, updateData: updatePricingData } = useFirestoreDocument('pricing', 'default', PricingSchema);
  const { data: quizAttempts, addItem: addQuizAttemptFirestore } = useFirestoreCollection('quizAttempts', QuizAttemptsCollectionSchema);
  const { data: studentUsers, addItem: addStudentUserFirestore } = useFirestoreCollection('studentUsers', StudentUsersCollectionSchema);
  const { data: feedback, addItem: addFeedbackFirestore } = useFirestoreCollection('feedback', FeedbackCollectionSchema);
  const { data: notifications, addItem: addNotificationFirestore, updateItem: updateNotification } = useFirestoreCollection('notifications', NotificationsCollectionSchema);
  const [theme, setTheme] = useTheme('light', 'theme');
  const [contentData, setContentData] = useState<ContentData>(initialContentData);
  
  const pricing = pricingData ?? initialPricing;

  useEffect(() => {
    const newContentData = classes.reduce((classAcc, currentClass) => {
        const classContent: ClassContent = subjects.reduce((subjectAcc, subject) => {
            subjectAcc[subject.id] = {
                notes: notes.filter(n => n.classId === currentClass.id && n.subjectId === subject.id),
                quizzes: quizzes.filter(q => q.classId === currentClass.id && q.subjectId === subject.id),
                tests: tests.filter(t => t.classId === currentClass.id && t.subjectId === subject.id),
            };
            return subjectAcc;
        }, {} as ClassContent);
        classAcc[currentClass.id] = classContent;
        return classAcc;
    }, {} as ContentData);

    setContentData(newContentData);
}, [notes, quizzes, tests]);
  
  const addActivityCallback = useCallback(async (activity: Omit<Activity, 'id'>) => {
    return addActivityFirestore(activity);
  }, [addActivityFirestore]);

  const addTransactionCallback = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    return addTransactionFirestore(transaction);
  }, [addTransactionFirestore]);

  const addDiscountCodeCallback = useCallback(async (code: Omit<DiscountCode, 'id'>) => {
    return addDiscountCodeFirestore(code);
  }, [addDiscountCodeFirestore]);

  const setPricingCallback = useCallback(async (newPricing: Pricing) => {
    await updatePricingData(newPricing);
  },[updatePricingData]);
  
  const addNotificationCallback = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    return await addNotificationFirestore({
        ...notification,
        timestamp: new Date(),
        read: false,
    });
  }, [addNotificationFirestore]);

  const markNotificationAsReadCallback = useCallback(async (notificationId: string) => {
      await updateNotification(notificationId, { read: true });
  }, [updateNotification]);

  const markAllNotificationsAsReadCallback = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    await Promise.all(unreadNotifications.map(n => updateNotification(n.id, { read: true })));
  }, [notifications, updateNotification]);

  const addContentCallback = async (type: 'note' | 'quiz' | 'test', data: any) => {
    let result;
    const dataToSave = { ...data };

    try {
        switch (type) {
            case 'note':
                result = await addNote(dataToSave);
                break;
            case 'quiz':
                result = await addQuiz(dataToSave);
                break;
            case 'test':
                result = await addTest(dataToSave);
                break;
            default:
                throw new Error('Invalid content type');
        }
    } catch (error) {
        console.error(`Failed to add ${type}:`, error);
        throw error;
    }
    
    const subject = subjects.find(s => s.id === data.subjectId);
    const classInfo = classes.find(c => c.id === data.classId);
    
    if(subject && classInfo) {
      await addNotificationCallback({
          title: `New ${type} added!`,
          message: `A new ${type} "${data.title}" has been added to ${subject.name} for ${classInfo.name}.`,
          classId: data.classId,
          subjectId: data.subjectId,
      });
    }

    return result;
  };

  const deleteContentCallback = useCallback(async (subjectId: string, type: 'note' | 'quiz' | 'test', id: string) => {
    let itemToDelete;
    let activityType: string = '';

    switch (type) {
        case 'note': 
            itemToDelete = notes.find(n => n.id === id);
            activityType = 'Deleted Note';
            await deleteNote(id);
            break;
        case 'quiz':
            itemToDelete = quizzes.find(q => q.id === id);
            activityType = 'Deleted Quiz';
            await deleteQuiz(id);
            break;
        case 'test':
            itemToDelete = tests.find(t => t.id === id);
            activityType = 'Deleted Test';
            await deleteTest(id);
            break;
    }

    if (itemToDelete) {
        const subject = subjects.find(s => s.id === itemToDelete!.subjectId);
        const classInfo = classes.find(c => c.id === itemToDelete!.classId);

        if (subject && classInfo) {
            await addActivityCallback({
                type: activityType,
                title: itemToDelete.title,
                subject: subject.name,
                class: classInfo.id,
                timestamp: new Date(),
                fileUrl: null,
            });
        }
    }
  }, [deleteNote, deleteQuiz, deleteTest, addActivityCallback, notes, quizzes, tests]);
  
  const handleAddQuizAttemptCallback = useCallback(async (attempt: Omit<QuizAttempt, 'id'>) => {
    const newAttempt = await addQuizAttemptFirestore(attempt) as QuizAttempt;
    const quiz = quizzes.find(q => q.id === attempt.quizId);

    if (quiz) {
        const subject = subjects.find(s => s.id === quiz.subjectId);
        const classInfo = classes.find(c => c.id === quiz.classId);
        if (subject && classInfo) {
             await addActivityCallback({
                type: 'Completed Quiz',
                title: quiz.title,
                subject: subject.name,
                class: classInfo.id,
                timestamp: new Date(),
                fileUrl: null
            });
        }
    }
    return newAttempt;
}, [addQuizAttemptFirestore, quizzes, addActivityCallback]);
  
  const addFeedbackCallback = useCallback(async (feedbackData: Omit<Feedback, 'id' | 'timestamp'>) => {
    return addFeedbackFirestore({ ...feedbackData, timestamp: new Date() });
  }, [addFeedbackFirestore]);

  const addStudentUserCallback = useCallback(async (user: Omit<StudentUser, 'id'>) => {
    return addStudentUserFirestore(user);
  }, [addStudentUserFirestore]);


  const value = {
    contentData,
    addContent: addContentCallback,
    deleteContent: deleteContentCallback,
    recentActivity,
    addActivity: addActivityCallback,
    transactions,
    addTransaction: addTransactionCallback,
    discountCodes,
    addDiscountCode: addDiscountCodeCallback,
    updateDiscountCode: useCallback((code: DiscountCode) => updateDiscountCode(code.id, code), [updateDiscountCode]),
    deleteDiscountCode: useCallback((id: string) => deleteDiscountCode(id), [deleteDiscountCode]),
    pricing,
    setPricing: setPricingCallback,
    quizAttempts,
    addQuizAttempt: handleAddQuizAttemptCallback,
    studentUsers,
    addStudentUser: addStudentUserCallback,
    feedback,
    addFeedback: addFeedbackCallback,
    theme,
    setTheme,
    notifications,
    addNotification: addNotificationCallback,
    markNotificationAsRead: markNotificationAsReadCallback,
    markAllNotificationsAsRead: markAllNotificationsAsReadCallback,
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

    
    