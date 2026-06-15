import React from "react";
import ReactDOM from "react-dom";

interface ModalProps {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
}

const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const boxStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 10, padding: "1.5rem", minWidth: 400, maxWidth: "90vw",
    maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 30px rgba(0,0,0,.18)",
};

export const Modal: React.FC<ModalProps> = ({ open, title, onClose, children }) => {
    if (!open) return null;
    return ReactDOM.createPortal(
        <div style={overlayStyle} onClick={onClose}>
            <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                    {title && <h3>{title}</h3>}
                    <button className="btn btn-outline" onClick={onClose}>✕</button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
};
