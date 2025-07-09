
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ItbIcon from '@/components/itb-icon';
import { loginEmployee } from './actions';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (formData: FormData) => {
    startTransition(async () => {
      const result = await loginEmployee(formData);

      if (result.success && result.employee) {
        if (result.employee.role === 'Chef') {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'Chefs do not have access to the POS system.',
            });
            return;
        }
        localStorage.setItem('currentEmployee', JSON.stringify(result.employee));
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${result.employee.name}!`,
        });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error || 'An unknown error occurred.',
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <ItbIcon className="h-10 w-10" />
            <CardTitle className="text-3xl font-headline text-primary">ITB Members</CardTitle>
          </div>
          <CardDescription>Enter your credentials to access the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg mt-4" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
