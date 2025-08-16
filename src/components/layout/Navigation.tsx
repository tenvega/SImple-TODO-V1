"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
    const pathname = usePathname();

    const breadcrumbs = [
        { name: 'Home', href: '/', icon: Home },
        ...(pathname === '/profile' ? [{ name: 'Profile', href: '/profile', icon: User }] : [])
    ];

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
            {breadcrumbs.map((breadcrumb, index) => {
                const Icon = breadcrumb.icon;
                const isLast = index === breadcrumbs.length - 1;

                return (
                    <React.Fragment key={breadcrumb.href}>
                        <Link
                            href={breadcrumb.href}
                            className={cn(
                                "flex items-center gap-1 hover:text-foreground transition-colors",
                                isLast && "text-foreground font-medium"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {breadcrumb.name}
                        </Link>
                        {!isLast && <ChevronRight className="h-4 w-4" />}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
