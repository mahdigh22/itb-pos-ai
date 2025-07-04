
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, LayoutDashboard, Users } from "lucide-react";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";

export default function AppSidebar() {
    const pathname = usePathname();

    const navLinks = [
        { href: '/', label: 'Point of Sale', icon: LayoutDashboard },
        { href: '/members', label: 'Members', icon: Users },
    ];

    return (
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 p-2">
                    <Button variant="ghost" size="icon" className="w-9 h-9 flex-shrink-0">
                        <Cpu className="h-6 w-6 text-sidebar-primary" />
                    </Button>
                    <div className="group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden">
                        <h1 className="text-lg font-headline font-semibold text-sidebar-primary">POSitive</h1>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navLinks.map((link) => (
                        <SidebarMenuItem key={link.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))}
                                tooltip={{ children: link.label }}
                            >
                                <Link href={link.href}>
                                    <link.icon className="h-5 w-5" />
                                    <span>{link.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarTrigger />
            </SidebarFooter>
        </Sidebar>
    );
}
