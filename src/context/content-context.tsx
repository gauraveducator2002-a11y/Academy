'use client';

import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { classes, subjects } from '@/lib/data';
import { useFirestoreCollection, useFirestoreDocument, useTheme } from '@/hooks/use-firestore';
import { v4 as uuidv4 } from 'uuid';

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
const UserSessionSchema = z.object({ activeSessionId: z.string(), lastLogin: z.date() });

// Collection Schemas
const NotesCollectionSchema = z.array(NoteSchema);
const TestsCollectionSchema = z.array(TestSchema);
const QuizzesCollectionSchema = z.array(QuizSchema);

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
export type ContentData = Record<string, SubjectContent>;

const initialContentData: ContentData = subjects.reduce((acc, subject) => {
    acc[subject.id] = { notes: [], quizzes: [], tests: [] };
    return acc;
}, {} as ContentData);

const initialPricing: Pricing = { notePriceInr: 830, quizPriceInr: 1245 };
const initialSession: UserSession = { activeSessionId: '', lastLogin: new Date() };


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
  addContent: (subjectId: string, type: 'note' | 'quiz' | 'test', data: any) => Promise<any>;
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
  startUserSession: (userId: string) => Promise<void>;
  isSessionValid: (userId: string) => Promise<boolean>;
  endUserSession: (userId: string) => Promise<void>;
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
  startUserSession: async () => {},
  isSessionValid: async () => true,
  endUserSession: async () => {},
});

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const { data: notes, addItem: addNote, deleteItem: deleteNote } = useFirestoreCollection('notes', NotesCollectionSchema);
  const { data: quizzes, addItem: addQuiz, deleteItem: deleteQuiz } = useFirestoreCollection('quizzes', QuizzesCollectionSchema);
  const { data: tests, addItem: addTest, deleteItem: deleteTest } = useFirestoreCollection('tests', TestsCollectionSchema);
  const { data: recentActivity, addItem: addActivity } = useFirestoreCollection('recentActivity', z.array(ActivitySchema));
  const { data: transactions, addItem: addTransaction } = useFirestoreCollection('transactions', z.array(TransactionSchema));
  const { data: discountCodes, addItem: addDiscountCode, updateItem: updateDiscountCode, deleteItem: deleteDiscountCode } = useFirestoreCollection('discountCodes', z.array(DiscountCodeSchema));
  const { data: pricing, updateData: updatePricingData } = useFirestoreDocument('pricing', 'default', initialPricing, PricingSchema);
  const { data: quizAttempts, addItem: addQuizAttempt } = useFirestoreCollection('quizAttempts', z.array(QuizAttemptSchema));
  const { data: studentUsers, addItem: addStudentUser } = useFirestoreCollection('studentUsers', z.array(StudentUserSchema));
  const { data: feedback, addItem: addFeedbackFirestore } = useFirestoreCollection('feedback', z.array(FeedbackSchema));
  const { data: notifications, addItem: addNotificationFirestore, updateItem: updateNotification } = useFirestoreCollection('notifications', z.array(NotificationSchema));
  const [theme, setTheme] = useTheme('light', 'theme');
  
  const { upsert: upsertSession, getDoc: getSessionDoc, deleteDoc: deleteSessionDoc } = useFirestoreDocument('sessions', undefined, initialSession, UserSessionSchema);

  const setPricing = useCallback(async (newPricing: Pricing) => {
    await updatePricingData(newPricing);
  },[updatePricingData]);


  const contentData = subjects.reduce((acc, subject) => {
    acc[subject.id] = {
        notes: notes.filter(n => n.subjectId === subject.id),
        quizzes: quizzes.filter(q => q.subjectId === subject.id),
        tests: tests.filter(t => t.subjectId === subject.id),
    };
    return acc;
  }, {} as ContentData);
  
  const startUserSession = useCallback(async (userId: string) => {
    if (typeof window === 'undefined') return;
    const sessionId = uuidv4();
    localStorage.setItem('session_id', sessionId);
    await upsertSession(userId, {
        activeSessionId: sessionId,
        lastLogin: new Date()
    });
  }, [upsertSession]);
  
  const isSessionValid = useCallback(async (userId: string) => {
    if (typeof window === 'undefined') return false;
    const currentSessionId = localStorage.getItem('session_id');
    if (!currentSessionId) return false;

    const sessionDoc = await getSessionDoc(userId);
    if (!sessionDoc) {
      return false;
    }
    
    return sessionDoc.activeSessionId === currentSessionId;
  }, [getSessionDoc]);

  const endUserSession = useCallback(async (userId: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('session_id');
    await deleteSessionDoc(userId);
  }, [deleteSessionDoc]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    return await addNotificationFirestore({
        ...notification,
        timestamp: new Date(),
        read: false,
    });
  }, [addNotificationFirestore]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
      await updateNotification(notificationId, { read: true });
  }, [updateNotification]);

  const markAllNotificationsAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    await Promise.all(unreadNotifications.map(n => updateNotification(n.id, { read: true })));
  }, [notifications, updateNotification]);

  const addContent = useCallback(async (subjectId: string, type: 'note' | 'quiz' | 'test', data: any) => {
    let result;
    const commonData = { ...data, subjectId };
    
    switch (type) {
      case 'note': result = await addNote(commonData); break;
      case 'quiz': result = await addQuiz(commonData); break;
      case 'test': result = await addTest(commonData); break;
      default: throw new Error('Invalid content type');
    }
    
    const subject = subjects.find(s => s.id === subjectId);
    const classInfo = classes.find(c => c.id === data.classId);
    
    if(subject && classInfo) {
      await addNotification({
          title: `New ${type} added!`,
          message: `A new ${type} "${data.title}" has been added to ${subject.name} for ${classInfo.name}.`,
          classId: data.classId,
          subjectId: subjectId,
      });
    }

    return result;
  }, [addNote, addQuiz, addTest, addNotification]);

  const deleteContent = useCallback(async (subjectId: string, type: 'note' | 'quiz' | 'test', id: string) => {
    switch (type) {
        case 'note': await deleteNote(id); break;
        case 'quiz': await deleteQuiz(id); break;
        case 'test': await deleteTest(id); break;
    }
  }, [deleteNote, deleteQuiz, deleteTest]);
  
  const handleAddQuizAttempt = useCallback(async (attempt: Omit<QuizAttempt, 'id'>) => {
    const newAttempt = await addQuizAttempt(attempt) as QuizAttempt;
    const quiz = quizzes.find(q => q.id === attempt.quizId);

    if (quiz) {
        const subject = subjects.find(s => s.id === quiz.subjectId);
        const classInfo = classes.find(c => c.id === quiz.classId);
        if (subject && classInfo) {
             addActivity({
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
}, [addQuizAttempt, quizzes, addActivity]);
  
  const addFeedback = useCallback(async (feedbackData: Omit<Feedback, 'id' | 'timestamp'>) => {
    return addFeedbackFirestore({ ...feedbackData, timestamp: new Date() });
  }, [addFeedbackFirestore]);

  const value = {
    contentData,
    addContent,
    deleteContent,
    recentActivity,
    addActivity,
    transactions,
    addTransaction,
    discountCodes,
    addDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    pricing,
    setPricing,
    quizAttempts,
    addQuizAttempt: handleAddQuizAttempt,
    studentUsers,
    addStudentUser,
    feedback,
    addFeedback,
    theme,
    setTheme,
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    startUserSession,
    isSessionValid,
    endUserSession,
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};
