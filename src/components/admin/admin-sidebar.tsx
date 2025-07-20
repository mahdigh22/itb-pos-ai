

"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, BookOpen, Users, Briefcase, Settings, LogOut, List, Sparkles, Square, BarChart, Languages } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Tooltip>
        <TooltipTrigger asChild>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t('changeLanguage')}>
                        <Languages className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage('ar')} disabled={i18n.language === 'ar'}>العربية</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">{t('changeLanguage')}</TooltipContent>
    </Tooltip>
  );
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation('common');

    const handleLogout = () => {
        localStorage.removeItem('currentAdmin');
        router.push('/admin/login');
    };

    const navLinks = [
        { href: '/admin', labelKey: "dashboard", icon: LayoutGrid },
        { href: '/admin/reports', labelKey: "reports", icon: BarChart },
        { href: '/admin/menu', labelKey: "menu", icon: BookOpen },
        { href: '/admin/ingredients', labelKey: "ingredients", icon: List },
        { href: '/admin/extras', labelKey: "extras", icon: Sparkles },
        { href: '/admin/tables', labelKey: "tables", icon: Square },
        { href: '/admin/users', labelKey: "users", icon: Users },
        { href: '/admin/employees', labelKey: "employees", icon: Briefcase },
        { href: '/admin/settings', labelKey: "settings", icon: Settings },
    ];

    return (
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 p-2">
                    <ItbIcon className="h-8 w-8 flex-shrink-0" />
                    <div className="group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden">
                        <h1 className="text-lg font-headline font-semibold text-sidebar-primary">{t('backofficeTitle')}</h1>
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
                                tooltip={{ children: t(link.labelKey) }}
                            >
                                <Link href={link.href}>
                                    <link.icon className="h-5 w-5" />
                                    <span>{t(link.labelKey)}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-2 flex flex-col gap-2">
                 <div className="flex items-center justify-around group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t('logout')}>
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">{t('logout')}</TooltipContent>
                    </Tooltip>
                 </div>
                <SidebarTrigger />
            </SidebarFooter>
        </Sidebar>
    );
}
