import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import collaborationVideo from '../assets/stock-footage-animated-k-presentation-male-and-female-employees-chatting-in-front-of-the-presentation-screen.webm';

export default function Hero() {
    const { user } = useAuth();
    return (
        <div className="relative overflow-hidden bg-[var(--bg-primary)] transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                {/* Responsive Grid Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    
                    {/* Text Content - Centered on mobile, left-aligned on desktop */}
                    <div className="text-center lg:text-left animate-slide-up order-1">
                        <h1 className="text-4xl tracking-tight font-extrabold text-[var(--text-primary)] sm:text-5xl md:text-6xl">
                            <span className="block">Amplify Your Mind. </span>
                            <span className="block text-primary-600 dark:text-primary-400 mt-2">Personalize the World.</span>
                        </h1>
                        <p className="mt-4 text-base text-[var(--text-secondary)] sm:mt-6 sm:text-lg md:text-xl font-serif italic max-w-xl mx-auto lg:mx-0">
                           See the latest blogs, publish blogs, generate custom memes, and explore daily quotes on a platform designed for clarity. Use our AI Assistant to decode complex text instantly and toggle your workspace to fit your vibe.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link 
                                to={user ? "/create" : "/signup"} 
                                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-md hover:shadow-lg md:py-4 md:text-lg md:px-10"
                            >
                                Start Writing
                            </Link>
                            <Link 
                                to="/quotes" 
                                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 transition-all md:py-4 md:text-lg md:px-10"
                            >
                                Read Wisdom
                            </Link>
                        </div>
                    </div>

                    {/* Video Section - Below text on mobile, right side on desktop */}
                    <div className="order-2 animate-fade-in">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            <video
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-auto object-cover"
                                style={{ maxHeight: '500px' }}
                            >
                                <source src={collaborationVideo} type="video/webm" />
                                Your browser does not support the video tag.
                            </video>
                            {/* Subtle overlay for enhanced visual */}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/10 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
