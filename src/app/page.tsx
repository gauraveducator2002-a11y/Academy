import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="flex w-full max-w-md flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <Logo className="mx-auto h-24 w-24" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground font-headline">
            Growth Academy
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Striving for Excellence
          </p>
        </div>
        <div className="w-full pt-6">
            <LoginForm />
        </div>
        <p className="px-8 pt-4 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{' '}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
