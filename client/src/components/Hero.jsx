import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import heroDarkGif from '../assets/hero-dark.gif';
import heroLightGif from '../assets/hero-light.gif';

export default function Hero() {
    const { user } = useAuth();
    const { theme } = useTheme();
    
    // Use light GIF for light theme, dark GIF for dark theme
    const heroGif = theme === 'light' ? heroLightGif : heroDarkGif;
    
    return (
        <div className="relative overflow-hidden transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-20">
                {/* Responsive Grid Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    
                    {/* Text Content - Left Side - Compact */}
                    <div className="text-left animate-slide-up order-1">
                        {/* Heading - Compact with tight spacing */}
                        <h1 className="font-black leading-tight mb-4 transition-colors duration-500">
                            <span className="block text-5xl sm:text-6xl lg:text-7xl mb-1 text-black dark:text-white">
                                Amplify Your
                            </span>
                            <span className="block text-5xl sm:text-6xl lg:text-7xl mb-1 text-black dark:text-white">
                                Mind.
                            </span>
                            <span className="block text-5xl sm:text-6xl lg:text-7xl" style={{ color: theme === 'light' ? '#ff8c42' : '#a78bfa' }}>
                                Personalize the
                            </span>
                            <span className="block text-5xl sm:text-6xl lg:text-7xl" style={{ color: theme === 'light' ? '#ff8c42' : '#a78bfa' }}>
                                World.
                            </span>
                        </h1>
                        
                        {/* Description paragraph - Highly Visible */}
                        <p className="mt-4 text-base sm:text-lg lg:text-xl text-black dark:text-gray-100 max-w-lg leading-relaxed transition-colors duration-500 font-bold" style={{ color: theme === 'light' ? '#000000' : undefined }}>
                           See the latest blogs, publish blogs, generate custom memes, and explore daily quotes on a platform designed for clarity. Use our AI Assistant to decode complex text instantly and shape your weekdays to your vibe.
                        </p>
                        
                        {/* CTA Buttons - Both styled as buttons */}
                        <div className="mt-8 flex flex-row gap-4 items-center">
                            <Link 
                                to={user ? "/create" : "/signup"} 
                                className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-lg text-white bg-black hover:bg-gray-800 dark:bg-black dark:hover:bg-gray-900 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                {user ? "Write Blogs" : "Get Started"}
                            </Link>
                            <Link 
                                to="/quotes" 
                                className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-lg text-white bg-black hover:bg-gray-800 dark:bg-black dark:hover:bg-gray-900 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                Read Wisdom
                            </Link>
                        </div>
                    </div>

                    {/* GIF Section - Right Side - Image-like styling */}
                    <div className="order-2 animate-fade-in relative">
                        {/* Subtle glow matching image */}
                        <div className="absolute -inset-4 bg-orange-200/40 dark:bg-purple-500/20 blur-2xl rounded-full transition-colors duration-500"></div>
                        
                        {/* GIF Container - Full display with proper height */}
                        <div 
                            className="relative rounded-2xl overflow-visible shadow-2xl transition-all duration-500"
                            style={{ 
                                border: theme === 'light' ? '6px solid #ff9f5a' : '4px solid rgba(168, 85, 247, 0.3)',
                                background: theme === 'light' ? 'linear-gradient(135deg, #ffb380 0%, #ffd4a3 100%)' : undefined,
                                minHeight: '400px'
                            }}
                        >
                            <img
                                src={heroGif}
                                alt="Writing collaboration"
                                className="w-full h-full object-cover transition-opacity duration-700 ease-in-out rounded-2xl"
                                width="800"
                                height="600"
                                loading="eager"
                                fetchPriority="high"
                                key={theme}
                                style={{ minHeight: '400px', objectPosition: 'center' }}
                            />

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
