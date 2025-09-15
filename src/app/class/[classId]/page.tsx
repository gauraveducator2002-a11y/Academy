
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { classes, subjects } from '@/lib/data';
import { ArrowRight, Book, Atom, Landmark, Calculator, Briefcase } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';

const subjectIcons: { [key: string]: React.ReactNode } = {
  mathematics: <Book className="h-8 w-8 text-primary" />,
  science: <Atom className="h-8 w-8 text-primary" />,
  'social-science': <Landmark className="h-8 w-8 text-primary" />,
  accountancy: <Calculator className="h-8 w-8 text-primary" />,
  'business-studies': <Briefcase className="h-8 w-8 text-primary" />,
};

export default function ClassPage() {
  const params = useParams();
  const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId;
  const currentClass = classes.find((c) => c.id === classId);

  if (!currentClass) {
    notFound();
  }
  
  const isCommerceStream = ['11', '12'].includes(classId);

  const subjectsForClass = isCommerceStream
    ? subjects.filter(s => ['accountancy', 'business-studies', 'mathematics'].includes(s.id))
    : subjects.filter(s => ['mathematics', 'science', 'social-science'].includes(s.id));

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">{currentClass.name}</h1>
            <p className="text-muted-foreground">Select a subject to view notes, tests, and results.</p>
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjectsForClass.map((subject) => (
          <Link href={`/class/${classId}/${subject.id}`} key={subject.id}>
            <Card className="group flex flex-col justify-between h-full transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4">{subjectIcons[subject.id]}</div>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription>Access materials for {subject.name}</CardDescription>
              </CardHeader>
              <div className="flex items-center justify-end p-4 pt-0">
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
