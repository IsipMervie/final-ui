import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { formatDistanceToNow } from "date-fns";
import "./App.css";

// ✅ Update this with your actual deployed backend URL from Render
const BACKEND_URL = "https://final-api-ryvo.onrender.com/posts";

function App() {
  const [posts, setPosts] = useState([]);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem("darkMode")) || false);

  const contentRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.classList.toggle("dark", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(BACKEND_URL);
      const data = await res.json();
      setPosts(data.reverse());
    } catch (error) {
      console.error("Failed to fetch posts", error);
      setPosts([]);
    }
  };

  const handleCreate = async () => {
    if (!author.trim() || !content.trim()) {
      return Swal.fire("Missing Input", "Please provide both author and content.", "error");
    }

    const newPost = {
      author,
      content,
      profilePictureUrl,
      likes: 0,
      shares: 0,
      comments: [],
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      const savedPost = await res.json();
      setPosts([savedPost, ...posts]);
      setAuthor("");
      setContent("");
      setProfilePictureUrl("");
    } catch (error) {
      console.error("Create post failed", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/${id}`, { method: "DELETE" });
      setPosts(posts.filter((post) => post.id !== id));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleLike = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/${id}/like`, { method: "PUT" });
      const updatedPost = await res.json();
      setPosts(posts.map((post) => (post.id === id ? updatedPost : post)));
    } catch (error) {
      console.error("Like failed", error);
    }
  };

  const handleShare = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/${id}/share`, { method: "PUT" });
      const updatedPost = await res.json();
      setPosts(posts.map((post) => (post.id === id ? updatedPost : post)));
    } catch (error) {
      console.error("Share failed", error);
    }
  };

  const handleComment = async (id, comment) => {
    if (!comment.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/${id}/comment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      });
      const updatedPost = await res.json();
      setPosts(posts.map((post) => (post.id === id ? updatedPost : post)));
    } catch (error) {
      console.error("Comment failed", error);
    }
  };

  const handleEdit = async (id, updatedPost) => {
    try {
      const res = await fetch(`${BACKEND_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPost),
      });
      const data = await res.json();
      setPosts(posts.map((post) => (post.id === id ? data : post)));
    } catch (error) {
      console.error("Edit failed", error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Social Media Feed</h1>
        <button onClick={() => setDarkMode((prev) => !prev)}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      <section className="create-post">
        <h2>Create Post</h2>
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          type="text"
          placeholder="Profile Picture URL (optional)"
          value={profilePictureUrl}
          onChange={(e) => setProfilePictureUrl(e.target.value)}
        />
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          ref={contentRef}
        />
        <button onClick={handleCreate}>Post</button>
      </section>

      <section className="posts-list">
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onShare={handleShare}
              onDelete={handleDelete}
              onComment={handleComment}
              onEdit={handleEdit}
              darkMode={darkMode}
            />
          ))
        )}
      </section>
    </div>
  );
}

function PostCard({ post, onLike, onShare, onDelete, onComment, onEdit, darkMode }) {
  const [commentInput, setCommentInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const handleSave = () => {
    onEdit(post.id, { ...post, content: editedContent });
    setIsEditing(false);
  };

  return (
    <div className={`post-card ${darkMode ? "dark" : ""}`}>
      <div className="post-header">
        {post.profilePictureUrl ? (
          <img src={post.profilePictureUrl} alt="Profile" className="profile-pic" />
        ) : (
          <div className="profile-placeholder">👤</div>
        )}
        <div>
          <h4>{post.author}</h4>
          <small>{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</small>
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
        />
      ) : (
        <p className="post-content">{post.content}</p>
      )}

      <div className="post-actions">
        <button onClick={() => onLike(post.id)}>👍 {post.likes}</button>
        <button onClick={() => onShare(post.id)}>🔁 {post.shares}</button>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "💾 Save" : "✏️ Edit"}
        </button>
        <button onClick={() => onDelete(post.id)}>🗑️ Delete</button>
      </div>

      <div className="comment-section">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onComment(post.id, commentInput) && setCommentInput("")}
        />
        <div className="comments">
          {post.comments?.length > 0 ? (
            post.comments.map((c, idx) => <p key={idx}>💬 {c}</p>)
          ) : (
            <p className="no-comments">No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
