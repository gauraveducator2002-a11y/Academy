'use client';

import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { classes, subjects } from '@/lib/data';

export type Note = { id: string; classId: string; subjectId: string; title: string; description: string; fileUrl: string; priceInr: number; };
export type Test = { id:string; classId: string; subjectId: string; title: string; description: string; testFileUrl: string; answerFileUrl: string; priceInr: number; };
export type QuizQuestion = { id: string; question: string; options: string[]; correctAnswer: number; };
export type Quiz = { id: string; classId: string; subjectId: string; title: string; description: string; priceInr: number; questions: QuizQuestion[]; timeLimit: number; };
export type QuizAttempt = { id: string; quizId: string; studentName: string; score: number; totalQuestions: number; timestamp: Date; answers: number[]; timeTaken: number; };
export type Activity = { id: string; type: string; title: string; subject: string; class: string; timestamp: Date; fileUrl: string | null; };
export type Transaction = { studentName: string; contentTitle: string; amount: number; referenceCode?: string; timestamp: Date; };
export type DiscountCode = { id: string; code: string; discount: number; };
export type Pricing = { notePriceInr: number; quizPriceInr: number; };
export type StudentUser = { id: string; username: string; email: string; classId: string; };
export type Feedback = { id: string; studentName: string; feedback: string; suggestion: string; rating: number; timestamp: Date; };
export type Theme = 'light' | 'dark';
export type Notification = { id: string; title: string; message: string; timestamp: Date; read: boolean; classId: string; subjectId: string; };

export type SubjectContent = {
  notes: Note[];
  quizzes: Quiz[];
  tests: Test[];
};

export type ContentData = Record<string, SubjectContent>;

const initialContentData: ContentData = {
  mathematics: {
    notes: [],
    quizzes: [],
    tests: [],
  },
  science: {
    notes: [],
    quizzes: [],
    tests: [],
  },
  'social-science': {
    notes: [],
    quizzes: [],
    tests: [],
  },
};

const initialRecentActivity: Activity[] = [];
const initialTransactions: Transaction[] = [];
const initialDiscountCodes: DiscountCode[] = [
  { id: 'discount-1', code: 'SAVE10', discount: 10 },
  { id: 'discount-2', code: 'PROMO20', discount: 20 },
];
const initialPricing: Pricing = {
    notePriceInr: 830,
    quizPriceInr: 1245,
};
const initialQuizAttempts: QuizAttempt[] = [];
const initialStudentUsers: StudentUser[] = [];
const initialFeedback: Feedback[] = [];
const initialNotifications: Notification[] = [];


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
  addContent: (subjectId: string, type: 'note' | 'quiz' | 'test', data: any) => void;
  deleteContent: (subjectId: string, type: 'note' | 'quiz' | 'test', id: string) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  addTransaction: (transaction: Transaction) => void;
  addDiscountCode: (code: Omit<DiscountCode, 'id'>) => void;
  updateDiscountCode: (code: DiscountCode) => void;
  deleteDiscountCode: (id: string) => void;
  setPricing: (pricing: Pricing) => void;
  addQuizAttempt: (attempt: QuizAttempt) => void;
  addStudentUser: (user: Omit<StudentUser, 'id'>) => void;
  addFeedback: (feedback: Omit<Feedback, 'id' | 'timestamp'>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
};

export const ContentContext = createContext<ContentContextType>({
  contentData: initialContentData,
  recentActivity: initialRecentActivity,
  transactions: initialTransactions,
  discountCodes: initialDiscountCodes,
  pricing: initialPricing,
  quizAttempts: initialQuizAttempts,
  studentUsers: initialStudentUsers,
  feedback: initialFeedback,
  theme: 'light',
  notifications: initialNotifications,
  setTheme: () => {},
  addContent: () => {},
  deleteContent: () => {},
  addActivity: () => {},
  addTransaction: () => {},
  addDiscountCode: () => {},
  updateDiscountCode: () => {},
  deleteDiscountCode: () => {},
  setPricing: () => {},
  addQuizAttempt: () => {},
  addStudentUser: () => {},
  addFeedback: () => {},
  addNotification: () => {},
  markNotificationAsRead: () => {},
  markAllNotificationsAsRead: () => {},
});

const useStickyState = <T,>(defaultValue: T, key: string) => {
    const [value, setValue] = useState<T>(defaultValue);
    const [hasLoaded, setHasLoaded] = useState(false);
  
    useEffect(() => {
      if (typeof window !== 'undefined') {
        try {
          const stickyValue = window.localStorage.getItem(key);
          if (stickyValue !== null) {
            setValue(JSON.parse(stickyValue, (key, value) => {
              if ((key === 'timestamp' || key.endsWith('At')) && typeof value === 'string' && !isNaN(Date.parse(value))) {
                return new Date(value);
              }
              return value;
            }));
          } else if (key === 'theme') {
             // Check system preference for theme
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            setValue(mediaQuery.matches ? 'dark' as any : 'light' as any);
          }
        } catch (error) {
          console.error(`Error reading localStorage key "${key}":`, error);
        } finally {
            setHasLoaded(true);
        }
      }
    }, [key]);
  
    useEffect(() => {
      if (typeof window !== 'undefined' && hasLoaded) {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      }
    }, [key, value, hasLoaded]);
  
    return [value, setValue] as const;
};

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const [contentData, setContentData] = useStickyState<ContentData>(initialContentData, 'contentData');
  const [recentActivity, setRecentActivity] = useStickyState<Activity[]>(initialRecentActivity, 'recentActivity');
  const [transactions, setTransactions] = useStickyState<Transaction[]>(initialTransactions, 'transactions');
  const [discountCodes, setDiscountCodes] = useStickyState<DiscountCode[]>(initialDiscountCodes, 'discountCodes');
  const [pricing, setPricing] = useStickyState<Pricing>(initialPricing, 'pricing');
  const [quizAttempts, setQuizAttempts] = useStickyState<QuizAttempt[]>(initialQuizAttempts, 'quizAttempts');
  const [studentUsers, setStudentUsers] = useStickyState<StudentUser[]>(initialStudentUsers, 'studentUsers');
  const [feedback, setFeedback] = useStickyState<Feedback[]>(initialFeedback, 'feedback');
  const [theme, setTheme] = useStickyState<Theme>('light', 'theme');
  const [notifications, setNotifications] = useStickyState<Notification[]>(initialNotifications, 'notifications');


  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
        ...notification,
        id: uuidv4(),
        timestamp: new Date(),
        read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, [setNotifications]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  }, [setNotifications]);

  const markAllNotificationsAsRead = useCallback(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifications]);


  const addContent = useCallback((subjectId: string, type: 'note' | 'quiz' | 'test', data: any) => {
    setContentData(prevData => {
      const subjectContent = prevData[subjectId] || { notes: [], quizzes: [], tests: [] };
      let newSubjectContent: SubjectContent;

      switch (type) {
        case 'note':
          newSubjectContent = { ...subjectContent, notes: [...subjectContent.notes, data] };
          break;
        case 'quiz':
          newSubjectContent = { ...subjectContent, quizzes: [...subjectContent.quizzes, data] };
          break;
        case 'test':
          newSubjectContent = { ...subjectContent, tests: [...subjectContent.tests, data] };
          break;
        default:
          newSubjectContent = subjectContent;
      }

      return { ...prevData, [subjectId]: newSubjectContent };
    });
    
    const subject = subjects.find(s => s.id === subjectId);
    const classInfo = classes.find(c => c.id === data.classId);
    
    addNotification({
        title: `New ${type} added!`,
        message: `A new ${type} "${data.title}" has been added to ${subject?.name} for ${classInfo?.name}.`,
        classId: data.classId,
        subjectId: subjectId,
    });

  }, [setContentData, addNotification]);

  const deleteContent = useCallback((subjectId: string, type: 'note' | 'quiz' | 'test', id: string) => {
    setContentData(prevData => {
      const subjectContent = prevData[subjectId];
      if (!subjectContent) return prevData;

      let newSubjectContent: SubjectContent;

      switch (type) {
        case 'note':
          newSubjectContent = { ...subjectContent, notes: subjectContent.notes.filter(item => item.id !== id) };
          break;
        case 'quiz':
          newSubjectContent = { ...subjectContent, quizzes: subjectContent.quizzes.filter(item => item.id !== id) };
          break;
        case 'test':
          newSubjectContent = { ...subjectContent, tests: subjectContent.tests.filter(item => item.id !== id) };
          break;
        default:
            newSubjectContent = subjectContent;
      }
      
      return { ...prevData, [subjectId]: newSubjectContent };
    });
  }, [setContentData]);

  const addActivity = useCallback((activity: Omit<Activity, 'id'>) => {
    const newActivity = { ...activity, id: uuidv4() };
    setRecentActivity(prevActivity => [newActivity, ...prevActivity]);
  }, [setRecentActivity]);
  
  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
  }, [setTransactions]);

  const addDiscountCode = useCallback((code: Omit<DiscountCode, 'id'>) => {
    const newCode = { ...code, id: uuidv4() };
    setDiscountCodes(prev => [...prev, newCode]);
  }, [setDiscountCodes]);

  const updateDiscountCode = useCallback((updatedCode: DiscountCode) => {
    setDiscountCodes(prev => prev.map(code => code.id === updatedCode.id ? updatedCode : code));
  }, [setDiscountCodes]);

  const deleteDiscountCode = useCallback((id: string) => {
    setDiscountCodes(prev => prev.filter(code => code.id !== id));
  }, [setDiscountCodes]);
  
  const addQuizAttempt = useCallback((attempt: QuizAttempt) => {
    setQuizAttempts(prev => {
        const newAttempts = [attempt, ...prev];
        const quiz = Object.values(contentData).flatMap(s => s.quizzes).find(q => q.id === attempt.quizId);
        if (quiz) {
            const subject = subjects.find(s => s.id === quiz.subjectId);
            const classInfo = classes.find(c => c.id === quiz.classId);
            addActivity({
                id: attempt.id,
                type: 'Completed Quiz',
                title: quiz.title,
                subject: subject?.name || 'Unknown',
                class: classInfo?.id || 'Unknown',
                timestamp: new Date(),
                fileUrl: null
            });
        }
        return newAttempts;
    });
  }, [setQuizAttempts, addActivity, contentData]);

  const addStudentUser = useCallback((user: Omit<StudentUser, 'id'>) => {
    const newUser = { ...user, id: uuidv4() };
    setStudentUsers(prev => [newUser, ...prev]);
  }, [setStudentUsers]);
  
  const addFeedback = useCallback((feedbackData: Omit<Feedback, 'id' | 'timestamp'>) => {
    const newFeedback = { ...feedbackData, id: uuidv4(), timestamp: new Date() };
    setFeedback(prev => [newFeedback, ...prev]);
  }, [setFeedback]);

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
    addQuizAttempt,
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
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};
