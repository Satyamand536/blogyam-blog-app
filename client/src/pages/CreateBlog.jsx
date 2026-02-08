import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_URL } from '../api/axios';
import { Image as ImageIcon, Loader2, Globe, Lock, AlertCircle, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Configure Quill for font sizes
const Size = ReactQuill.Quill.import('attributors/style/size');
Size.whitelist = ['small', false, 'large', 'huge'];
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
                            alert("Only the author of this blog can edit it.");
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

        try {
            if (isEditMode) {
                console.log(`[Frontend] Patching blog ID: ${id}`);
                const { data } = await api.patch(`/blogs/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (data.success) {
                    navigate(`/blog/${id}`);
                }
            } else {
                const { data } = await api.post('/blogs', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (data.success) {
                    navigate(`/blog/${data.blogId}`);
                }
            }
        } catch (error) {
            console.error("Failed to save blog", error);
            alert("Failed to save blog. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['code-block', 'clean']
        ],
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

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `${API_URL}${path}`;
    };

    if (!user) return null; // Or generic loading

    return (
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-10 md:pt-10 transition-colors duration-500 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--text-primary)]">
                    {fetching ? 'Loading Story...' : isEditMode ? 'Edit Your Story' : 'Draft a New Story'}
                </h1>
                
                {!isAuthorOrOwner && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium border border-yellow-200 dark:border-yellow-800">
                        <Lock size={16} />
                        <span>Public publishing restricted to Authors</span>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title Input */}
                <div className="group">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Title..."
                        className="w-full text-5xl font-serif font-bold border-none focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-600 px-0 bg-transparent text-[var(--text-primary)] transition-all duration-300"
                        required
                    />
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap gap-6 items-center p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm">
                    {/* Category */}
                    <div className="flex flex-col gap-1">
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

                     {/* Image Management */}
                    <div className="flex-1 flex flex-col sm:flex-row justify-end items-center gap-4">
                        {(file || (existingBanner && !removeBanner)) && (
                            <div className="relative group/preview w-24 h-14 rounded-lg overflow-hidden border border-[var(--border-color)] shadow-sm">
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
                        
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 font-semibold transition-all bg-primary-50 dark:bg-primary-900/10 px-4 py-2 rounded-xl text-sm border border-primary-200 dark:border-primary-800">
                                <ImageIcon size={18} />
                                <span>{(file || (existingBanner && !removeBanner)) ? "Change" : "Add Cover"}</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={e => {
                                        if(e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                            setRemoveBanner(false);
                                        }
                                    }} 
                                    accept="image/*"
                                />
                            </label>

                            {existingBanner && !removeBanner && !file && (
                                <button 
                                    type="button"
                                    onClick={() => setRemoveBanner(true)}
                                    className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-semibold transition-all bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-xl text-sm border border-red-200 dark:border-red-800"
                                >
                                    <Trash2 size={18} />
                                    <span>Remove</span>
                                </button>
                            )}
                            
                            {removeBanner && !file && (
                                <button 
                                    type="button"
                                    onClick={() => setRemoveBanner(false)}
                                    className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 font-semibold transition-all bg-orange-50 dark:bg-orange-900/10 px-4 py-2 rounded-xl text-sm border border-orange-200 dark:border-orange-800"
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
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <button 
                                type="button"
                                onClick={() => setHindiMode(!hindiMode)}
                                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all border ${
                                    hindiMode 
                                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 shadow-sm' 
                                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-primary)]'
                                }`}
                            >
                                <span className="text-lg">ॐ</span>
                                {hindiMode ? 'Hindi Transliteration: ON' : 'Enable Hindi Typing'}
                            </button>
                            {hindiMode && (
                                <span className="text-[11px] text-orange-500 animate-pulse font-medium">
                                    Phonetic Mode: Type 'namaste' -&gt; नमस्ते
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-[var(--border-color)]">
                            <AlertCircle size={12} />
                            <span>Tip: Use '-Tx' icon in toolbar to reset font styles.</span>
                        </div>
                    </div>

                    <ReactQuill 
                        theme="snow"
                        value={body}
                        onChange={handleBodyChange}
                        modules={modules}
                        placeholder="Tell your story... (Type phonetically in Hindi Mode)"
                        className="bg-transparent text-[var(--text-primary)]" 
                    />
                    <style>{`
                        .ql-container {
                            font-size: 1.125rem;
                            border: none !important;
                            min-height: 400px;
                        }
                        .ql-editor {
                            min-height: 400px;
                            padding: 1rem 0;
                            line-height: 1.8;
                            color: var(--text-primary);
                        }
                        .ql-toolbar {
                            border: none !important;
                            border-bottom: 1px solid var(--border-color) !important;
                            margin-bottom: 2rem;
                            padding: 10px 0 !important;
                        }
                        /* Enhanced 'Clear Format' Button */
                        .ql-clean {
                            width: auto !important;
                            padding-right: 8px !important;
                            display: flex !important;
                            align-items: center !important;
                            gap: 4px;
                            border: 1px solid var(--border-color) !important;
                            border-radius: 4px !important;
                            margin-left: 8px !important;
                        }
                        .ql-clean::after {
                            content: "Clear Styling";
                            font-size: 0.7rem;
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
