import React from "react";

/* Sidebar is rendered server-side in base.html – this component is available
   if an island ever needs to render a sidebar dynamically. */

interface SidebarLink {
    label: string;
    emoji: string;
    href: string;
}

const links: SidebarLink[] = [
    { label: "Planning", emoji: "📋", href: "/planning" },
    { label: "Daily Report", emoji: "📝", href: "/daily-report" },
    { label: "Dashboard", emoji: "📊", href: "/dashboard" },
    { label: "Timesheet", emoji: "⏱️", href: "/timesheet" },
    { label: "Actual Qty", emoji: "📦", href: "/actual" },
    { label: "Setup", emoji: "⚙️", href: "/setup" },
];

export const Sidebar: React.FC = () => (
    <nav className="sidebar">
        <div className="sidebar-brand">
            <h2>PACE</h2>
            <small>Intelligence Construction</small>
        </div>
        <ul className="sidebar-nav">
            {links.map((l) => (
                <li key={l.href}>
                    <a href={l.href} className={location.pathname === l.href ? "active" : ""}>
                        {l.emoji} {l.label}
                    </a>
                </li>
            ))}
        </ul>
    </nav>
);
