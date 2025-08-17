"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, CircleUser, Sun, Moon, Monitor } from "lucide-react";

// --- Navigation links ---
const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/prepare", label: "Prepare" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // Read login state from localStorage
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    if (token || email) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    router.push("/");
  };

  // Prevent hydration mismatch: render skeleton until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            ALCHPREP
          </Link>
          <div className="h-9 w-9 animate-pulse rounded-full border border-border/50 bg-muted" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link
          href="/"
          className="mr-6 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <span>ALCHPREP</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isLoggedIn ? (
            <UserMenu onLogout={handleLogout} />
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        <div className="md:hidden">
          <MobileSheet isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
}

// --- Sub-components ---
const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-border/50 transition-colors hover:border-border hover:bg-accent"
        >
          <Sun className="h-4 w-4 scale-100 dark:scale-0" />
          <Moon className="absolute h-4 w-4 scale-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={theme === "light" ? "bg-accent" : ""}
        >
          <Sun className="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent" : ""}
        >
          <Moon className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={theme === "system" ? "bg-accent" : ""}
        >
          <Monitor className="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UserMenu = ({ onLogout }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full border border-border/50 transition-colors hover:border-border hover:bg-accent"
      >
        <CircleUser className="h-4 w-4" />
        <span className="sr-only">Toggle user menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuItem>Support</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={onLogout}
        className="text-destructive focus:text-destructive cursor-pointer"
      >
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const MobileSheet = ({ isLoggedIn, onLogout }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-accent">
        <Menu className="h-4 w-4" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-xs">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span>ALCHPREP</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navLinks.map((link) => (
          <SheetClose asChild key={link.href}>
            <Link
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          </SheetClose>
        ))}
      </nav>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center justify-between">
          {isLoggedIn && <UserMenu onLogout={onLogout} />}
          <ThemeToggle />
        </div>
        {!isLoggedIn && (
          <Button asChild className="mt-4 w-full font-medium">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </SheetContent>
  </Sheet>
);
