'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Cpu, Delete } from 'lucide-react';

const CORRECT_PIN = '1234';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      setPin(pin + key);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleLogin = () => {
    if (pin === CORRECT_PIN) {
      // In a real app, you'd use a more secure method like httpOnly cookies
      localStorage.setItem('isLoggedIn', 'true');
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      router.push('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Incorrect PIN. Please try again.',
      });
      setPin('');
    }
  };

  const numpadKeys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-background p-4">
      <Card className="w-full max-w-sm mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Cpu className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline">POSitive</CardTitle>
          </div>
          <CardDescription>Enter your PIN to unlock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <Input
              type="password"
              value={pin}
              readOnly
              className="w-48 h-14 text-center text-4xl tracking-[0.5em] font-mono bg-muted"
              placeholder="----"
              aria-label="PIN code display"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {numpadKeys.map((key) => (
              <Button
                key={key}
                variant="outline"
                className="h-20 text-2xl font-bold"
                onClick={() => handleKeyPress(key)}
              >
                {key}
              </Button>
            ))}
             <Button
                variant="outline"
                className="h-20 text-2xl font-bold"
                onClick={handleClear}
                aria-label="Clear PIN"
              >
                C
              </Button>
               <Button
                variant="outline"
                className="h-20 text-2xl font-bold"
                onClick={() => handleKeyPress('0')}
              >
                0
              </Button>
              <Button
                variant="outline"
                className="h-20 text-2xl font-bold"
                onClick={handleDelete}
                aria-label="Delete last digit"
              >
                <Delete className="h-8 w-8" />
              </Button>
          </div>
          <Button className="w-full mt-6 h-16 text-xl" onClick={handleLogin}>
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}