
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Info } from 'lucide-react';
import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, getDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showSignupHint, setShowSignupHint] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    setShowSignupHint(false);
    try {
      const userCred = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      // Quick check for admin role to determine redirect
      const uid = userCred.user.uid;
      const adminRef = doc(firestore, 'admin_users', uid);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists() || values.email === 'abdallah@almoftah.com') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      
      router.refresh();

    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setShowSignupHint(true);
        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
          description: "Incorrect email or password. Please check your credentials.",
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Error',
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {showSignupHint && (
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Need help?</strong> If you are an employee, please use the credentials provided by your Super Admin.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-11" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : 'Sign In'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
