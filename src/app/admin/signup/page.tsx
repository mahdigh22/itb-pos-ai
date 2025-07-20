
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signupAdmin } from './actions';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AdminSignupPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = (formData: FormData) => {
    startTransition(async () => {
      const result = await signupAdmin(formData);
      
      if (result.success && result.admin) {
        localStorage.setItem('currentAdmin', JSON.stringify(result.admin));
        
        toast({
          title: 'Account Created!',
          description: `Welcome, ${result.admin.name}! Your restaurant is ready.`,
        });
        router.push('/admin');
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign-up Failed',
          description: result.error || 'Could not create account.',
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <UtensilsCrossed className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-headline text-primary">Create Restaurant</CardTitle>
          </div>
          <CardDescription>Set up your restaurant and administrator account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input id="restaurantName" name="restaurantName" placeholder="e.g., The Salty Spoon" required disabled={isPending} />
            </div>
            <Separator />
            <p className="text-sm font-medium text-muted-foreground pt-2">Administrator Details</p>
             <div className="space-y-2">
              <Label htmlFor="adminName">Your Full Name</Label>
              <Input id="adminName" name="adminName" placeholder="e.g., Alex Doe" required disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required disabled={isPending} />
            </div>
            <Button type="submit" className="w-full h-12 text-lg mt-4" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Create & Login
            </Button>
          </form>
        </CardContent>
         <CardFooter className="flex-col gap-4">
            <Separator />
            <div className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/admin/login" className="font-semibold text-primary hover:underline">
                    Login here
                </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
