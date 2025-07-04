'use client';

import { useState, useEffect } from 'react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { members } from "@/lib/data";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, ArrowLeft, Edit } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from '@/components/ui/skeleton';

export default function MemberProfilePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') : null;
        if (isLoggedIn !== 'true') {
            router.replace('/login');
        } else {
            setIsLoading(false);
        }
    }, [router]);

    const member = members.find((m) => m.id === id);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-10 w-28" />
                </div>
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-center gap-6">
                        <Skeleton className="h-28 w-28 rounded-full" />
                        <div className="flex-grow space-y-2">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-5 w-3/4" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </CardHeader>
                    <CardContent className="border-t pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!member) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-headline font-bold">Member Profile</h1>
                 <Button variant="outline" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <Avatar className="h-28 w-28 border">
                        <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint}/>
                        <AvatarFallback className="text-4xl">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <CardTitle className="font-headline text-3xl">{member.name}</CardTitle>
                        <CardDescription className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-muted-foreground">
                            <Mail className="h-4 w-4"/>
                            {member.email}
                        </CardDescription>
                    </div>
                     <Button>
                        <Edit className="mr-2 h-4 w-4"/>
                        Edit Profile
                     </Button>
                </CardHeader>
                <CardContent className="border-t pt-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Phone className="h-5 w-5 text-muted-foreground"/>
                            <span className="font-medium">{member.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Calendar className="h-5 w-5 text-muted-foreground"/>
                            <span className="font-medium">Joined on {format(new Date(member.joined), "PPP")}</span>
                        </div>
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}