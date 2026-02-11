import { useState, useEffect } from 'react';
import api from '../api/axios';
import { RefreshCw, Download, AlertTriangle, X } from 'lucide-react';
import { HiPhoto } from 'react-icons/hi2';
import OptimizedImage from '../components/OptimizedImage';
import { getImageUrl } from '../utils/imageUtils';

export default function MemeGenerator() {
    const [memes, setMemes] = useState([]);
    const [currentMeme, setCurrentMeme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [topText, setTopText] = useState('');
    const [bottomText, setBottomText] = useState('');
    const [notification, setNotification] = useState(null);

    // Fetch memes from our Production API (Database-first)
    const fetchTemplates = async () => {
        try {
            const response = await api.get('/memes/templates');
            
            const result = response.data;
            if (result.success && result.data) {
                const formattedMemes = result.data.map(m => ({
                    id: m._id,
                    name: m.name,
                    url: m.imageUrl,
                    fallback: m.fallbackUrl,
                    box_count: m.boxCount
                }));
                setMemes(formattedMemes);
                
                if (formattedMemes.length > 0) {
                    const randomMeme = formattedMemes[Math.floor(Math.random() * formattedMemes.length)];
                    setCurrentMeme(randomMeme);
                }
            }
        } catch (error) {
            console.error("Error fetching meme templates:", error);
            if (error.response && error.response.status === 429) {
                 const msg = error.response.data?.message || "Rate limit exceeded";
                 setNotification(typeof msg === 'string' ? msg : JSON.stringify(msg));
                 setLoading(false);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const generateRandomMeme = async () => {
        // Clear old notifications when user tries again
        setNotification(null);

        if (memes.length > 0) {
            const randomMeme = memes[Math.floor(Math.random() * memes.length)];
            setCurrentMeme(randomMeme);
            setTopText('');
            setBottomText('');

            // Track popularity in background
            if (randomMeme && randomMeme.id) {
                try {
                    await api.post(`/memes/templates/${randomMeme.id}/popularity`);
                } catch (e) {
                    if (e.response && e.response.status === 429) {
                        const msg = e.response.data?.message || "Rate limit exceeded";
                        setNotification(typeof msg === 'string' ? msg : JSON.stringify(msg));
                    }
                }
            }
        } else {
            // If memes list is empty (likely due to initial rate limit), try to fetch again
            fetchTemplates();
        }
    };

    const handleImageError = (e) => {
        if (currentMeme?.fallback && e.target.src !== currentMeme.fallback) {
            console.log("Switching to local meme fallback URL...");
            e.target.src = currentMeme.fallback;
        }
    };

    const downloadMeme = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.crossOrigin = 'anonymous';
        
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            
            // Draw image
            ctx.drawImage(image, 0, 0);
            
            // Configure text style
            const fontSize = Math.max(image.width / 15, 24);
            ctx.font = `bold ${fontSize}px Impact, sans-serif`;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = fontSize / 20;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            // Draw top text
            if (topText) {
                const x = canvas.width / 2;
                const y = 20;
                ctx.strokeText(topText.toUpperCase(), x, y);
                ctx.fillText(topText.toUpperCase(), x, y);
            }
            
            // Draw bottom text
            if (bottomText) {
                const x = canvas.width / 2;
                ctx.textBaseline = 'bottom';
                const y = canvas.height - 20;
                ctx.strokeText(bottomText.toUpperCase(), x, y);
                ctx.fillText(bottomText.toUpperCase(), x, y);
            }
            
            // Download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `meme-${Date.now()}.png`;
                link.click();
                URL.revokeObjectURL(url);
            });
        };
        
        // Try original URL, let onload handle it, or use fallback if explicitly known to be broken
        image.src = getImageUrl(currentMeme.url);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-500">
            {/* Sticky Notification */}
            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-red-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-red-500">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="flex-shrink-0" size={24} />
                            <p className="font-bold text-sm sm:text-base leading-tight">
                                {notification}
                            </p>
                        </div>
                        <button 
                            onClick={() => setNotification(null)}
                            className="p-1 hover:bg-red-700 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] py-8 transition-colors duration-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <HiPhoto className="text-primary-600" size={32} />
                            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--text-primary)]">
                                Meme Generator
                            </h1>
                        </div>
                        <p className="text-[var(--text-secondary)] text-lg">
                            Create and share your own memes with custom text
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <RefreshCw className="animate-spin text-primary-600" size={48} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Meme Preview */}
                        <div className="space-y-6">
                            <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] transition-colors duration-500">
                                <div className="relative">
                                    {currentMeme && (
                                        <>
                                            <OptimizedImage
                                                src={getImageUrl(currentMeme.url)}
                                                alt={currentMeme.name}
                                                fallbackSrc={getImageUrl(currentMeme.fallback)}
                                                className="w-full h-auto object-contain"
                                                style={{ maxHeight: '500px' }}
                                                priority={true} // Priority as it's the main interaction point
                                                onError={handleImageError}
                                            />
                                            {/* Text Overlay Preview */}
                                            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                                                {topText && (
                                                    <div className="text-center">
                                                        <h2 
                                                            className="text-white font-black uppercase text-2xl sm:text-3xl md:text-4xl"
                                                            style={{
                                                                textShadow: '2px 2px 4px black, -2px -2px 4px black, 2px -2px 4px black, -2px 2px 4px black',
                                                                fontFamily: 'Impact, sans-serif'
                                                            }}
                                                        >
                                                            {topText}
                                                        </h2>
                                                    </div>
                                                )}
                                                {bottomText && (
                                                    <div className="text-center">
                                                        <h2 
                                                            className="text-white font-black uppercase text-2xl sm:text-3xl md:text-4xl"
                                                            style={{
                                                                textShadow: '2px 2px 4px black, -2px -2px 4px black, 2px -2px 4px black, -2px 2px 4px black',
                                                                fontFamily: 'Impact, sans-serif'
                                                            }}
                                                        >
                                                            {bottomText}
                                                        </h2>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)] transition-colors duration-500">
                                    <p className="text-sm text-[var(--text-secondary)] text-center font-medium">
                                        {currentMeme?.name}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={generateRandomMeme}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all shadow-md hover:shadow-lg"
                            >
                                <RefreshCw size={20} />
                                Generate New Meme
                            </button>
                        </div>

                        {/* Right: Controls */}
                        <div className="space-y-6">
                            <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg p-6 space-y-6 transition-colors duration-500 border border-[var(--border-color)]">
                                <h3 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
                                    Customize Your Meme
                                </h3>

                                <div className="space-y-4">
                                    {/* Top Text Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            Top Text
                                        </label>
                                        <input
                                            type="text"
                                            value={topText}
                                            onChange={(e) => setTopText(e.target.value)}
                                            placeholder="Enter top text..."
                                            className="input-field"
                                            maxLength={50}
                                        />
                                    </div>

                                    {/* Bottom Text Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            Bottom Text
                                        </label>
                                        <input
                                            type="text"
                                            value={bottomText}
                                            onChange={(e) => setBottomText(e.target.value)}
                                            placeholder="Enter bottom text..."
                                            className="input-field"
                                            maxLength={50}
                                        />
                                    </div>

                                    {/* Download Button */}
                                    <button
                                        onClick={downloadMeme}
                                        disabled={!topText && !bottomText}
                                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-wisdom-500 text-white font-medium rounded-xl hover:bg-wisdom-900 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download size={20} />
                                        Download Meme
                                    </button>

                                    {/* Clear Button */}
                                    <button
                                        onClick={() => {
                                            setTopText('');
                                            setBottomText('');
                                        }}
                                        className="w-full px-6 py-3 bg-[var(--bg-card)] dark:bg-slate-700 text-[var(--text-primary)] font-medium rounded-xl border border-[var(--border-color)] dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"
                                    >
                                        Clear Text
                                    </button>
                                </div>
                            </div>

                            {/* Tips Card */}
                            <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-6 border border-primary-200 dark:border-primary-900/20 transition-colors duration-500">
                                <h4 className="font-bold text-primary-900 dark:text-primary-300 mb-2">💡 Pro Tips</h4>
                                <ul className="text-sm text-primary-800 dark:text-primary-400 space-y-1">
                                    <li>• Keep text short and punchy</li>
                                    <li>• Use ALL CAPS for classic meme style</li>
                                    <li>• Download after adding your text</li>
                                    <li>• Try different templates!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
