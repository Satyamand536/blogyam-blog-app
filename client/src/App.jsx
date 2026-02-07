import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BackButton from './components/BackButton';
import ScrollToTopButton from './components/ScrollToTopButton';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BlogReader from './pages/BlogReader';
import Dashboard from './pages/Dashboard';
import CreateBlog from './pages/CreateBlog';
import MyBlogs from './pages/MyBlogs';
import Quotes from './pages/Quotes';
import MemeGenerator from './pages/MemeGenerator';
import AuthorsList from './pages/AuthorsList';
import AuthorProfile from './pages/AuthorProfile';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col transition-colors duration-500 ease-in-out">
          <Navbar />
          <BackButton />
          <ScrollToTopButton />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/meme-generator" element={<MemeGenerator />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/authors" element={<AuthorsList />} />
              <Route path="/authors/:id" element={<AuthorProfile />} />
              <Route path="/blog/:id" element={<BlogReader />} />
              <Route path="/create" element={<CreateBlog />} />
              <Route path="/edit/:id" element={<CreateBlog />} />
              <Route path="/my-blogs" element={<MyBlogs />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

