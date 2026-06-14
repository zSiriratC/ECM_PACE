import React from "react";

interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = "", actions }) => (
    <div className={`card ${className}`}>
        {(title || actions) && (
            <div className="flex justify-between items-center mb-2">
                {title && <h3>{title}</h3>}
                {actions}
            </div>
        )}
        {children}
    </div>
);
