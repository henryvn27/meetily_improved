import { useEffect } from 'react';

interface MessageToastProps {
    message: string;
    type: 'success' | 'error';
    show: boolean;
    setShow: (show: boolean) => void;
}

export function MessageToast({ message, type, show, setShow }: MessageToastProps) {
    
    useEffect(() => {
        if (!show) return;

        const timer = setTimeout(() => {
            setShow(false);
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [setShow, show]);

    if (!show) return null;

    return (
        <span
            role={type === 'error' ? 'alert' : 'status'}
            className={type === 'success' ? 'text-success' : 'text-destructive'}
        >
            {message}
        </span>
    );
}
