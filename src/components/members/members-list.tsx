"use client"

import * as React from "react"
import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Member } from "@/lib/types"
import { format } from "date-fns"


export default function MembersList({ members }: { members: Member[] }) {
    return (
        <Card className="h-full flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-0">
                <Table>
                    <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                            <TableHead className="w-[250px]">Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="hidden lg:table-cell">Phone</TableHead>
                            <TableHead className="hidden sm:table-cell">Joined</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {member.name}
                                    </div>
                                </TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell className="hidden lg:table-cell">{member.phone}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <Badge variant="outline">{format(new Date(member.joined), "PPP")}</Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/members/${member.id}`}>View Profile</Link>
                                            </DropdownMenuItem>
                                             <DropdownMenuItem>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
