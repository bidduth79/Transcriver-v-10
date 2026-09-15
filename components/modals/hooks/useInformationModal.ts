import { useState, useRef } from 'react';
import { getApiUrl } from '../../../services/api';

export const useInformationModal = ({ addToast, appLang }: any) => {
    const [activeTab, setActiveTab] = useState('sidebar');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [size, setSize] = useState({ width: 1100, height: 850 });
    const isResizing = useRef(false);

    const runDbSetup = async () => {
        try {
            const url = getApiUrl('setup.php');
            console.log("Attempting to DB Setup at URL:", url);
            const res = await fetch(url);
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch(e) {
                console.error("Invalid JSON:", text);
                if (addToast) addToast("Invalid response from server", 'error');
                return;
            }

            if (data.status === 'success') {
                if (addToast) addToast(appLang === 'bn' ? 'ডাটাবেস সেটআপ সফল হয়েছে!' : 'Database Setup Successful!', 'success');
            } else {
                if (addToast) addToast('Setup Error: ' + (data.message || 'Unknown'), 'error');
            }
        } catch (e: any) {
            console.error("Fetch error:", e);
            if (addToast) addToast((appLang === 'bn' ? 'সার্ভার কানেকশন ব্যর্থ: ' : 'Server Connection Failed: ') + (e.message || 'Unknown error'), 'error');
        }
    };

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopResizing);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const modalElement = document.getElementById('info-modal-container');
        if (modalElement) {
            const rect = modalElement.getBoundingClientRect();
            setSize({
                width: Math.max(800, e.clientX - rect.left),
                height: Math.max(600, e.clientY - rect.top)
            });
        }
    };

    const stopResizing = () => {
        isResizing.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', stopResizing);
    };

    return {
        activeTab, setActiveTab,
        isMinimized, setIsMinimized,
        isMaximized, setIsMaximized,
        size,
        startResizing,
        runDbSetup
    };
};
