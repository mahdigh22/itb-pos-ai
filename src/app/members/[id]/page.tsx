import { members } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function MemberProfilePage({ params }: { params: { id: string } }) {
    const member = members.find((m) => m.id === params.id);

    if (!member) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                 <Button variant="outline" asChild>
                    <Link href="/members">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Members
                    </Link>
                </Button>
            </div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person avatar"/>
                        <AvatarFallback className="text-3xl">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <CardTitle className="font-headline text-3xl">{member.name}</CardTitle>
                        <CardDescription>{member.email}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                     <div className="flex items-center gap-4 text-muted-foreground">
                        <Phone className="h-5 w-5"/>
                        <span>{member.phone}</span>
                     </div>
                     <div className="flex items-center gap-4 text-muted-foreground">
                        <Calendar className="h-5 w-5"/>
                        <span>Joined on {format(new Date(member.joined), "PPP")}</span>
                     </div>
                </CardContent>
                <CardFooter>
                     <Button className="w-full sm:w-auto">
                        Edit Profile
                     </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
