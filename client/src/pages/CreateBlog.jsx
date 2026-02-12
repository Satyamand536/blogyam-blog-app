import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_URL } from '../api/axios';
import { getImageUrl } from '../utils/imageUtils';
import { Image as ImageIcon, Loader2, Globe, Lock, AlertCircle, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Configure Quill for numeric font sizes (MS Word Style)
const Size = ReactQuill.Quill.import('attributors/style/size');
Size.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px'];
ReactQuill.Quill.register(Size, true);

// Configure Quill for Colors and Alignment
const Color = ReactQuill.Quill.import('attributors/style/color');
ReactQuill.Quill.register(Color, true);
const Align = ReactQuill.Quill.import('attributors/style/align');
ReactQuill.Quill.register(Align, true);

export default function CreateBlog() {
    const navigate = useNavigate();
    const { id } = useParams(); // For Edit Mode
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [category, setCategory] = useState('Technology');
    const [difficulty, setDifficulty] = useState('Medium');
    const [file, setFile] = useState(null);
    const [existingBanner, setExistingBanner] = useState('');
    const [removeBanner, setRemoveBanner] = useState(false);
    const [visibility, setVisibility] = useState('public');
    const [tags, setTags] = useState('');
    const [hindiMode, setHindiMode] = useState(false);

    const isEditMode = Boolean(id);

    // Fetch blog if in edit mode
    useEffect(() => {
        if (isEditMode) {
            const fetchBlog = async () => {
                setFetching(true);
                try {
                    const { data } = await api.get(`/blogs/${id}`);
                    if (data.success) {
                        const { blog } = data;
                        // Check specifically for author match in edit mode
                        if (user && blog.author._id !== user._id) {
                            showToast("Only the author of this blog can edit it.", "error");
                            navigate('/');
                            return;
                        }
                        setTitle(blog.title);
                        setBody(blog.body);
                        setCategory(blog.category);
                        setDifficulty(blog.difficulty);
                        setVisibility(blog.visibility);
                        setTags(blog.tags ? blog.tags.join(', ') : '');
                        if (blog.coverImageURL) {
                            setExistingBanner(blog.coverImageURL);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching blog for edit", error);
                } finally {
                    setFetching(false);
                }
            };
            fetchBlog();
        }
    }, [id, isEditMode, navigate, user]);

    // Role Logic
    const isAuthorOrOwner = user?.role === 'author' || user?.role === 'owner';

    useEffect(() => {
        if (!isAuthorOrOwner && !isEditMode) {
            setVisibility('private');
        }
    }, [user, isAuthorOrOwner, isEditMode]);

    // ... transliterate function ...
    const transliterate = (text) => {
        if (!hindiMode) return text;
        
        const charMap = {
            'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ', 
            'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ', 'n': 'ं', 'h': 'ः',
            'm': 'ं', 'r': '्र', 
            
            'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ',
            'cha': 'च', 'chha': 'छ', 'ja': 'ज', 'jha': 'झ',
            'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
            'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
            'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व',
            'sha': 'श', 'sa': 'स', 'ha': 'ह', 'tra': 'त्र', 'gya': 'ज्ञ', 'ksha': 'क्ष',

            // Common Words
            'namaste': 'नमस्ते', 'dhanyawad': 'धन्यवाद', 'bharat': 'भारत',
            'mai': 'मैं', 'hu': 'हूँ', 'kya': 'क्या', 'hal': 'हाल', 'hai': 'है',
            'aap': 'आप', 'kaise': 'कैसे', 'ho': 'हो', 'main': 'मैं', 'bhi': 'भी',
            'theek': 'ठीक', 'accha': 'अच्छा', 'bahut': 'बहुत', 'shukriya': 'शुक्रिया',
            'ji': 'जी', 'han': 'हाँ', 'nahi': 'नही', 'kyun': 'क्यूँ', 'kab': 'कब',
            'kahan': 'कहाँ', 'kaun': 'कौन', 'kaise': 'कैसे', 'kitna': 'कितना',
            'meraa': 'मेरा', 'meri': 'मेरी', 'mere': 'मेरे', 'tumhara': 'तुम्हारा',
            'unka': 'उनका', 'hamara': 'हमारा', 'blog': 'ब्लॉग', 'kahani': 'कहानी',
            'lekh': 'लेख', 'shabd': 'शब्द', 'vichar': 'विचार'
        };

        // Improved detection: handles words followed by spaces, nbsp, or punctuation
        return text.replace(/([a-zA-Z]+)(&nbsp;|\s|[.,!?;])/g, (match, word, space) => {
            const lowerWord = word.toLowerCase();
            return (charMap[lowerWord] || word) + space;
        }).replace(/&nbsp;/g, ' '); // Clean up &nbsp; which causes gaps
    };

    const handleBodyChange = (content) => {
        if (hindiMode) {
            const processed = transliterate(content);
            if (processed !== content) {
                setBody(processed);
                return;
            }
        }
        setBody(content);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        const cleanedBody = body.replace(/&nbsp;/g, ' ');
        formData.append('title', title);
        formData.append('body', cleanedBody);
        formData.append('category', category);
        formData.append('difficulty', difficulty);
        formData.append('visibility', visibility);
        formData.append('tags', tags);
        if (removeBanner) {
            formData.append('removeCoverImage', 'true');
        }
        if (file) formData.append('coverImage', file);

        // Debug: Log file object
        if (file) {
            console.log('[CreateBlog Debug] Uploading file:', file.name, file.size, file.type);
        } else {
            console.log('[CreateBlog Debug] No file selected (or existing banner used)');
        }

        try {
            if (isEditMode) {
                console.log(`[Frontend] Patching blog ID: ${id}`);
                const { data } = await api.patch(`/blogs/${id}`, formData);
                if (data.success) {
                    navigate(`/blog/${id}`);
                }
            } else {
                const { data } = await api.post('/blogs', formData);
                if (data.success) {
                    navigate(`/blog/${data.blogId}`);
                }
            }
        } catch (error) {
            console.error("Failed to save blog", error);
            showToast("Failed to save blog. Please check your connection and try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const modules = {
        toolbar: {
            container: "#toolbar",
        }
    };

    const formats = [
        'header', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'color', 'background',
        'script',
        'list', 'bullet',
        'align',
        'link', 'image', 'video',
        'code-block'
    ];

    // Local getImageUrl removed to use the imported utility from '../utils/imageUtils'
    // which handles absolute URLs correctly.

    if (!user) return null; // Or generic loading

    return (
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-10 md:pt-10 transition-colors duration-500 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-3 md:gap-4">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--text-primary)]">
                    {fetching ? 'Loading Story...' : isEditMode ? 'Edit Your Story' : 'Draft a New Story'}
                </h1>
                
                {!isAuthorOrOwner && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 rounded-lg text-xs font-bold border-2 border-emerald-600 dark:border-emerald-700 shadow-md">
                        <Lock size={14} className="flex-shrink-0" />
                        <span>Public publishing restricted to Authors</span>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
                {/* Title Input */}
                <div className="group">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Title..."
                        className="w-full text-3xl sm:text-4xl md:text-5xl font-serif font-bold border-none focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-600 px-0 bg-transparent text-[var(--text-primary)] transition-all duration-300"
                        required
                    />
                </div>

                {/* Mobile Preview Area */}
                {(file || (existingBanner && !removeBanner)) && (
                    <div className="md:hidden w-full min-h-[200px] max-h-[450px] rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-inner relative group/mobile-preview bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <img 
                            src={file ? URL.createObjectURL(file) : getImageUrl(existingBanner)} 
                            className="w-full h-full object-contain" 
                            alt="Mobile Preview"
                        />
                        <button 
                            type="button"
                            onClick={() => {
                                if (file) setFile(null);
                                else setRemoveBanner(true);
                            }}
                            className="absolute top-4 right-4 p-3 bg-red-600/90 text-white rounded-full shadow-lg backdrop-blur-sm z-10"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}

                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-stretch md:items-center p-3 md:p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm mb-4 md:mb-6">
                    <div className="flex flex-wrap md:flex-nowrap gap-3 md:gap-6 items-center flex-1">
                        {/* Category */}
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Category</label>
                        <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="bg-transparent border-none p-0 text-sm font-medium text-[var(--text-primary)] focus:ring-0 cursor-pointer"
                        >
                            {['Technology', 'Spiritual', 'Lifestyle', 'Career', 'Poem'].map(c => (
                                <option key={c} value={c} className="bg-[var(--bg-card)]">{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Difficulty */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Difficulty</label>
                        <select 
                            value={difficulty} 
                            onChange={e => setDifficulty(e.target.value)}
                            className="bg-transparent border-none p-0 text-sm font-medium text-[var(--text-primary)] focus:ring-0 cursor-pointer"
                        >
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <option key={d} value={d} className="bg-[var(--bg-card)]">{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Visibility (Author/Owner Only) */}
                    {isAuthorOrOwner ? (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Visibility</label>
                            <button 
                                type="button"
                                onClick={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                                    visibility === 'public' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}
                            >
                                {visibility === 'public' ? <Globe size={16} /> : <Lock size={16} />}
                                {visibility === 'public' ? 'Public' : 'Private'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 opacity-60">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Visibility</label>
                            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                                <Lock size={16} />
                                <span>Private (Restricted)</span>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Image Management */}
                    <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-[var(--border-color)]">
                        {(file || (existingBanner && !removeBanner)) && (
                            <div className="hidden md:block relative group/preview w-24 h-14 rounded-lg overflow-hidden border border-[var(--border-color)] shadow-sm">
                                <img 
                                    src={file ? URL.createObjectURL(file) : getImageUrl(existingBanner)} 
                                    className="w-full h-full object-cover" 
                                    alt="Preview"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (file) setFile(null);
                                            else setRemoveBanner(true);
                                        }}
                                        className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        title="Remove Image"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <label className="flex items-center justify-center gap-2 cursor-pointer text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 font-semibold transition-all bg-primary-50 dark:bg-primary-900/10 px-4 py-3 rounded-xl text-sm border border-primary-200 dark:border-primary-800 active:scale-95">
                                <ImageIcon size={18} />
                                <span>{(file || (existingBanner && !removeBanner)) ? "Change" : "Add Cover"}</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={e => {
                                        const selectedFile = e.target.files[0];
                                        if(selectedFile) {
                                            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/avif'];
                                            if (!allowedTypes.includes(selectedFile.type)) {
                                                showToast("File type not supported. Please use JPG, PNG, or WEBP.", "warning");
                                                return;
                                            }
                                            setFile(selectedFile);
                                            setRemoveBanner(false);
                                            showToast("Cover image selected successfully!", "success");
                                        }
                                    }} 
                                    accept="image/*"
                                />
                            </label>

                            {existingBanner && !removeBanner && !file && (
                                <button 
                                    type="button"
                                    onClick={() => setRemoveBanner(true)}
                                    className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-semibold transition-all bg-red-50 dark:bg-red-900/10 px-4 py-3 rounded-xl text-sm border border-red-200 dark:border-red-800 active:scale-95"
                                >
                                    <Trash2 size={18} />
                                    <span>Remove</span>
                                </button>
                            )}
                            
                            {removeBanner && !file && (
                                <button 
                                    type="button"
                                    onClick={() => setRemoveBanner(false)}
                                    className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 font-semibold transition-all bg-orange-50 dark:bg-orange-900/10 px-4 py-3 rounded-xl text-sm border border-orange-200 dark:border-orange-800 active:scale-95"
                                >
                                    <X size={18} />
                                    <span>Undo Remove</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editor Section */}
                <div className="prose-editor">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 md:gap-3">
                            <button 
                                type="button"
                                onClick={() => setHindiMode(!hindiMode)}
                                className={`flex items-center gap-2 text-xs md:text-sm font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all border ${
                                    hindiMode 
                                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 shadow-sm' 
                                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-primary)]'
                                }`}
                            >
                                <span className="text-base md:text-lg">ॐ</span>
                                {hindiMode ? 'Hindi: ON' : 'Hindi Mode'}
                            </button>
                            {hindiMode && (
                                <span className="text-[10px] text-orange-500 animate-pulse font-medium">
                                    Type 'namaste' -&gt; नमस्ते
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-secondary)] bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-full border border-[var(--border-color)]">
                            <AlertCircle size={10} />
                            <span>Tip: Use '-Tx' icon to reset.</span>
                        </div>
                    </div>

                    {/* Custom Toolbar with Tooltips */}
                    <div id="toolbar" className="flex flex-wrap gap-1 md:gap-2 p-1.5 md:p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-t-xl mb-0!">
                        <span className="ql-formats">
                            <select className="ql-header" title="Heading Level">
                                <option value="1"></option>
                                <option value="2"></option>
                                <option value="3"></option>
                                <option value=""></option>
                            </select>
                            <select className="ql-size" title="Font Size" defaultValue="16px">
                                <option value="12px">12</option>
                                <option value="14px">14</option>
                                <option value="16px">16</option>
                                <option value="18px">18</option>
                                <option value="20px">20</option>
                                <option value="24px">24</option>
                                <option value="28px">28</option>
                                <option value="32px">32</option>
                                <option value="36px">36</option>
                                <option value="48px">48</option>
                                <option value="64px">64</option>
                            </select>
                        </span>
                        <span className="ql-formats text-black dark:text-white">
                            <button className="ql-bold" title="Bold (Ctrl+B)"></button>
                            <button className="ql-italic" title="Italic (Ctrl+I)"></button>
                            <button className="ql-underline" title="Underline (Ctrl+U)"></button>
                            <button className="ql-strike" title="Strikethrough"></button>
                        </span>
                        <span className="ql-formats">
                            <select className="ql-color" title="Text Color"></select>
                            <select className="ql-background" title="Background Color"></select>
                        </span>
                        <span className="ql-formats">
                            <button className="ql-list" value="ordered" title="Numbered List"></button>
                            <button className="ql-list" value="bullet" title="Bullet List"></button>
                        </span>
                        <span className="ql-formats">
                            <button className="ql-blockquote" title="Quote Block"></button>
                            <button className="ql-code-block" title="Code Block"></button>
                            <button className="ql-link" title="Insert Link"></button>
                        </span>
                        <span className="ql-formats">
                            <button className="ql-image" title="Insert Image"></button>
                            <button className="ql-video" title="Insert Video"></button>
                        </span>
                        <span className="ql-formats">
                            <button className="ql-clean" title="Clear Formatting"></button>
                        </span>
                    </div>

                    <ReactQuill 
                        theme="snow"
                        value={body}
                        onChange={handleBodyChange}
                        modules={modules}
                        placeholder="Tell your story... (Type phonetically in Hindi Mode)"
                        className="bg-transparent text-black dark:text-white border-t-0!" 
                    />
                    <style>{`
                        /* ROBUST MOBILE TOOLBAR FIXES */
                        
                        .ql-container {
                            font-size: 1.125rem;
                            border: none !important;
                            min-height: 500px; /* Taller editor for better UX */
                        }
                        .ql-editor {
                            min-height: 500px; /* Matches container */
                            padding: 1.5rem 0.5rem;
                            line-height: 1.8;
                            color: var(--text-primary);
                        }
                        
                        /* Straighten placeholder text - remove italic */
                        .ql-editor.ql-blank::before {
                            font-style: normal !important;
                            color: var(--text-secondary) !important;
                            opacity: 0.5;
                        }

                        /* Toolbar Container - Lower z-index to prevent hiding headers */
                        .ql-toolbar.ql-snow {
                            border: 1px solid var(--border-color) !important;
                            background: var(--bg-card);
                            border-radius: 12px 12px 0 0;
                            margin-bottom: 0 !important;
                            padding: 12px 10px !important;
                            position: sticky;
                            top: 70px; /* Below navbar - prevents hiding "Write" header */
                            z-index: 10; /* Lower than navbar (z-50) */
                            transition: box-shadow 0.3s ease;
                            display: flex;
                            flex-wrap: wrap;
                            gap: 4px;
                        }

                        /* MOBILE & TABLET OPTIMIZATIONS */
                        @media (max-width: 1024px) {
                            .ql-toolbar.ql-snow {
                                position: relative !important; /* Remove sticky on mobile - prevents overlapping */
                                top: auto !important;
                                padding: 8px 4px !important;
                                z-index: 10 !important;
                            }

                            .ql-formats {
                                display: flex !important;
                                align-items: center;
                                flex-wrap: wrap;
                                gap: 6px;
                                margin-right: 4px !important;
                                padding: 2px !important;
                                border-radius: 8px;
                                background: rgba(0, 0, 0, 0.02);
                                border-right: none !important;
                            }

                            /* Professional Touch Targets */
                            .ql-toolbar.ql-snow button {
                                width: 36px !important;
                                height: 36px !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                border-radius: 10px !important;
                                background: transparent !important;
                                transition: all 0.2s ease;
                                margin: 0 !important;
                            }

                            .ql-toolbar.ql-snow .ql-picker-label {
                                height: 36px !important;
                                min-width: 50px !important;
                                border: 1px solid var(--border-color) !important;
                                border-radius: 10px !important;
                                display: flex !important;
                                align-items: center !important;
                                background: var(--bg-card) !important;
                            }

                            /* Icon visibility */
                            .ql-snow .ql-stroke {
                                stroke-width: 2.2px !important;
                            }
                        }

                        /* Ensure dropdowns stay within viewport */
                        .ql-snow .ql-picker-options {
                            background-color: var(--bg-card) !important;
                            color: var(--text-primary) !important;
                            border: 1px solid var(--border-color) !important;
                        }

                        /* Enhanced 'Clear Format' Button */
                        .ql-clean {
                            width: auto !important;
                            padding-right: 16px !important;
                            padding-left: 14px !important;
                            display: flex !important;
                            align-items: center !important;
                            gap: 6px;
                            border: 1px solid var(--border-color) !important;
                            border-radius: 10px !important;
                            height: 40px !important;
                        }
                        .ql-clean::after {
                            content: "Clear";
                            font-size: 0.8rem;
                            font-weight: 600;
                        }
                    `}</style>
                </div>

                 {/* Submit */}
                <div className="flex justify-end pt-8 border-t border-[var(--border-color)]">
                     <button 
                        type="submit" 
                        disabled={loading || !title || !body}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : null}
                        {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Story' : 'Publish Story')}
                    </button>
                </div>
            </form>
        </div>
    );
}
