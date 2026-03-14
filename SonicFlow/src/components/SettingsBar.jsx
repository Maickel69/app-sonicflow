import React, { useState, useEffect } from 'react';
import { Download, FolderOpen, Loader2 } from 'lucide-react';
import '../App.css'; // Make sure styles are available

const SettingsBar = ({ downloadPath, setDownloadPath }) => {
    const [settingsMsg, setSettingsMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const chooseDirectory = async () => {
        setIsLoading(true);
        setSettingsMsg('Abriendo selector de carpetas...');

        try {
            const res = await fetch('/api/choose-directory', { method: 'POST' });
            const data = await res.json();

            if (data.success && data.path) {
                setDownloadPath(data.path);
                setSettingsMsg('✓ Carpeta guardada!');
                setTimeout(() => setSettingsMsg(''), 3000);
            } else if (data.message === 'Cancelled') {
                setSettingsMsg('Operación cancelada');
                setTimeout(() => setSettingsMsg(''), 2000);
            } else {
                setSettingsMsg('Error: ' + (data.error || 'No se pudo abrir el selector'));
                setTimeout(() => setSettingsMsg(''), 5000);
            }
        } catch (e) {
            console.error('Dialog error:', e);
            setSettingsMsg('Error: No se pudo abrir el selector de carpetas');
            setTimeout(() => setSettingsMsg(''), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <div
                className="current-path"
                onClick={chooseDirectory}
                title="Click para cambiar la carpeta de descargas"
                style={{ cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
            >
                <span className="path-label">Guardar en:</span>
                <span className="path-value">{downloadPath || 'Carpeta predeterminada'}</span>
                {isLoading ? (
                    <Loader2 size={14} className="edit-icon spin" />
                ) : (
                    <FolderOpen size={14} className="edit-icon" />
                )}
            </div>
            {settingsMsg && <span className="settings-msg">{settingsMsg}</span>}
        </div>
    );
};

export default SettingsBar;
