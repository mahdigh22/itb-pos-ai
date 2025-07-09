
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ItbIcon from '@/components/itb-icon';

const CORRECT_EMAIL = 'admin@example.com';
const CORRECT_PASSWORD = 'password';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = () => {
    if (email === CORRECT_EMAIL && password === CORRECT_PASSWORD) {
      // Create a temporary admin user object to grant access
      const adminEmployee = {
        id: 'admin-bootstrap',
        name: 'Admin',
        email: CORRECT_EMAIL,
        role: 'Manager',
        startDate: new Date().toISOString(),
      };
      localStorage.setItem('currentEmployee', JSON.stringify(adminEmployee));
      
      toast({
        title: 'Login Successful',
        description: 'Welcome to the Backoffice! Please create your employee accounts.',
      });
      router.push('/admin');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Incorrect email or password.',
      });
      setPassword('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <ItbIcon className="h-10 w-10" />
            <CardTitle className="text-3xl font-headline text-primary">Backoffice</CardTitle>
          </div>
          <CardDescription>Enter your credentials to access the admin portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg mt-4">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
