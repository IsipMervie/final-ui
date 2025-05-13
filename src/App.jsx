import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { formatDistanceToNow } from 'date-fns';
import "./App.css";

// Base API URL - Replace with your Render backend URL
const API_BASE_URL = "https://final-api-ryvo.onrender.com";

const Post = ({ post, onDelete, onLike, onShare, onComment, onEdit, darkMode }) => {
  // ... [Keep all your existing Post component code exactly the same] ...
};

function App() {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostAuthor, setNewPostAuthor] = useState("");
  const [newPostImageUrls, setNewPostImageUrls] = useState("");
  const [newPostProfilePicture, setNewPostProfilePicture] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopUsers, setShowTopUsers] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const searchRef = useRef(null);
  const contentRef = useRef(null);

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Could not load posts from server',
        });
        setPosts([]);
      }
    };
    fetchPosts();
  }, []);

  // Dark mode toggle (unchanged)
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const scrollToSearch = () => searchRef.current?.scrollIntoView({ behavior: "smooth" });

  // Create a new post
  const createPost = async () => {
    if (!newPostAuthor.trim() || !newPostContent.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Author and content are required!',
        confirmButtonColor: '#4361ee'
      });
      return;
    }

    const newPost = {
      author: newPostAuthor,
      content: newPostContent,
      profilePictureUrl: newPostProfilePicture || undefined,
      imageUrls: newPostImageUrls.split(',').map(url => url.trim()).filter(url => url),
      likes: 0,
      shares: 0,
      comments: [],
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create post");
      }
      
      const data = await response.json();
      setPosts(prevPosts => [data, ...prevPosts]);
      setShowCreateForm(false);
      resetForm();
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Post Created!',
        showConfirmButton: false,
        timer: 1500,
        toast: true
      });
    } catch (error) {
      console.error("Error creating post:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to create post. Please try again.',
        confirmButtonColor: '#4361ee'
      });
    }
  };

  const resetForm = () => {
    setNewPostContent("");
    setNewPostAuthor("");
    setNewPostImageUrls("");
    setNewPostProfilePicture("");
  };

  // Edit post
  const editPost = async (id, updatedPost) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPost),
      });
      if (!response.ok) throw new Error('Failed to update post');
      const data = await response.json();
      setPosts(prevPosts => prevPosts.map(post => (post.id === id ? data : post));
    } catch (error) {
      console.error("Error updating post:", error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Could not update post',
      });
    }
  };

  // Delete post
  const deletePost = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete post');
      setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
    } catch (error) {
      console.error("Error deleting post:", error);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.message || 'Could not delete post',
      });
    }
  };

  // Like post
  const likePost = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}/like`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error('Failed to like post');
      const data = await response.json();
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { ...post, ...data, liked: true } : post
      ));
    } catch (error) {
      console.error("Error liking post:", error);
      // Fallback UI update if API fails
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { ...post, likes: post.likes + 1, liked: true } : post
      ));
    }
  };

  // Share post
  const sharePost = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}/share`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error('Failed to share post');
      const data = await response.json();
      setPosts(prevPosts => prevPosts.map(post => (post.id === id ? data : post)));
    } catch (error) {
      console.error("Error sharing post:", error);
      // Fallback UI update
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { ...post, shares: post.shares + 1 } : post
      ));
    }
  };

  // Add comment
  const commentOnPost = async (id, commentText) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}/comment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }), // Ensure backend expects this format
      });
      if (!response.ok) throw new Error('Failed to add comment');
      const data = await response.json();
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { ...post, comments: [...(post.comments || []), data.comment] } : post
      ));
    } catch (error) {
      console.error("Error adding comment:", error);
      // Fallback UI update
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { 
          ...post, 
          comments: [...(post.comments || []), commentText] 
        } : post
      ));
    }
  };

  // ... [Keep all your existing UI rendering code exactly the same] ...
  // Only the API-related functions above needed changes

  return (
    // ... [Keep your entire JSX return block exactly the same] ...
  );
}

export default App;
