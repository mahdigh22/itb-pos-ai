
"use client"

import * as React from "react"
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Member } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function MembersList({ members }: { members: Member[] }) {
    return (
        <Card className="h-full flex flex-col">
            <ScrollArea className="h-full">
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {members.map((member) => (
                            <Link href={`/members/${member.id}`} key={member.id} className="block">
                                <Card className="h-full text-center transition-all hover:shadow-lg hover:border-primary cursor-pointer border-2 border-transparent">
                                    <CardContent className="flex flex-col items-center justify-center p-4 gap-3">
                                        <Avatar className="w-24 h-24 border-2 border-muted">
                                            <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} />
                                            <AvatarFallback className="text-3xl">{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="font-semibold font-headline text-lg">{member.name}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </ScrollArea>
        </Card>
    )
}
