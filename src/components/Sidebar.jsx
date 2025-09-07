import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, LayoutDashboard, User, Settings, Menu, X, LogOut } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

// --- Collapsible Sidebar ---
const CollapsibleSidebar = ({ email, username, onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkScreenSize = () => {
                const mobile = window.innerWidth < 768;
                setIsMobile(mobile);
                if (mobile) setIsCollapsed(true);
            };
            checkScreenSize();
            window.addEventListener('resize', checkScreenSize);
            return () => window.removeEventListener('resize', checkScreenSize);
        }
    }, []);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const menuItems = [
        { icon: Home, label: "Home", href: "/" },
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: User, label: "Profile", href: "/dashboard/profile" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" }
    ];

    const getInitials = (email) => {
        if (!email) return "U";
        const name = email.split('@')[0];
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <TooltipProvider>
            <div className={`flex flex-col h-screen bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    {!isCollapsed && <h2 className="text-lg font-semibold tracking-tight text-white">ALCHPREP</h2>}
                    <Button variant="ghost" size="sm" onClick={toggleSidebar} className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800">
                        {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 p-2">
                    <nav className="space-y-2">
                        {menuItems.map((item, index) => {
                            const MenuItem = (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 rounded-md hover:text-white hover:bg-zinc-800 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <item.icon className="h-4 w-4 flex-shrink-0" />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </Link>
                            );

                            return isCollapsed ? (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>{MenuItem}</TooltipTrigger>
                                    <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
                                </Tooltip>
                            ) : MenuItem;
                        })}
                    </nav>
                </div>

                {/* User Account */}
                <div className="p-4 border-t border-zinc-800">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://avatars.dicebear.com/api/initials/${username}.svg`} />
                            <AvatarFallback className="bg-blue-600 text-white text-xs">{getInitials(email)}</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{username}</p>
                                <p className="text-xs text-zinc-400 truncate">{email}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-3">
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={onLogout} className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-zinc-800">
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right"><p>Logout</p></TooltipContent>
                            </Tooltip>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start gap-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800">
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default CollapsibleSidebar;