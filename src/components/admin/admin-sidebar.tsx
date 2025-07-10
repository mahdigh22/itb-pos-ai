

"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, BookOpen, Users, Briefcase, Settings, LogOut, List, Sparkles, Square, BarChart } from "lucide-react";
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
import ItbIcon from "../itb-icon";
import { ThemeToggle } from "../theme-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import LanguageToggle from "../language-toggle";

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('currentAdmin');
        router.push('/admin/login');
    };

    const navLinks = [
        { href: '/admin', label: "Dashboard", icon: LayoutGrid },
        { href: '/admin/reports', label: "Reports", icon: BarChart },
        { href: '/admin/menu', label: "Menu", icon: BookOpen },
        { href: '/admin/ingredients', label: "Ingredients", icon: List },
        { href: '/admin/extras', label: "Extras", icon: Sparkles },
        { href: '/admin/tables', label: "Tables", icon: Square },
        { href: '/admin/users', label: "Users", icon: Users },
        { href: '/admin/employees', label: "Employees", icon: Briefcase },
        { href: '/admin/settings', label: "Settings", icon: Settings },
    ];

    return (
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 p-2">
                    <ItbIcon className="h-8 w-8 flex-shrink-0" />
                    <div className="group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden">
                        <h1 className="text-lg font-headline font-semibold text-sidebar-primary">Backoffice</h1>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navLinks.map((link) => (
                        <SidebarMenuItem key={link.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname.endsWith(link.href)}
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
            <SidebarFooter className="p-2 flex flex-col gap-2">
                 <div className="flex items-center justify-around group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
                    <LanguageToggle />
                    <ThemeToggle />
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log Out">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">Log Out</TooltipContent>
                    </Tooltip>
                 </div>
                <SidebarTrigger />
            </SidebarFooter>
        </Sidebar>
    );
}
