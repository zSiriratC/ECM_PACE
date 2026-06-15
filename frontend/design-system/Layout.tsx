import React from "react";

interface LayoutProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ title, children, actions }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <h1>{title}</h1>
            {actions}
        </div>
        {children}
    </div>
);
