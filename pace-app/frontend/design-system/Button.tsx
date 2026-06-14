import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "danger" | "success" | "outline";
}

export const Button: React.FC<ButtonProps> = ({ variant = "primary", className = "", children, ...rest }) => (
    <button className={`btn btn-${variant} ${className}`} {...rest}>
        {children}
    </button>
);
