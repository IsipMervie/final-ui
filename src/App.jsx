import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { formatDistanceToNow } from 'date-fns';
import "./App.css";

const Post = ({ post, onDelete, onLike, onShare, onComment, onEdit, darkMode }) => {
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [timeAgo, setTimeAgo] = useState(
    post.timestamp ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true }) : 'Just now'
  );
  const commentsRef = useRef(null);

  useEffect(() => {
    if (!post.timestamp) return;
    
    const updateTime = () => {
      setTimeAgo(formatDistanceToNow(new Date(post.timestamp), { addSuffix: true }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [post.timestamp]);

  const handleAddComment = () => {
    if (comment.trim()) {
      onComment(post.id, comment);
      setComment("");
    }
  };

  const handleSaveEdit = () => {
    const updatedPost = {
      ...post,
      content: editedContent,
      timestamp: post.timestamp
    };
    onEdit(post.id, updatedPost);
    setIsEditing(false);
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Post Updated!',
      showConfirmButton: false,
      timer: 1500,
      toast: true
    });
  };

  const confirmDelete = () => {
    Swal.fire({
      title: 'Delete Post?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4361ee',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(post.id);
        Swal.fire({
          title: 'Deleted!',
          text: 'Your post has been deleted.',
          icon: 'success',
          confirmButtonColor: '#4361ee'
        });
      }
    });
  };

  useEffect(() => {
    if (showComments && commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [showComments, post.comments]);

  return (
    <div className={`post ${darkMode ? 'dark' : ''}`}>
      <div className="post-header">
        {post.profilePictureUrl ? (
          <img className="profile-img" src={post.profilePictureUrl} alt="Profile" />
        ) : (
          <div className="profile-placeholder">
            <i className="fas fa-user"></i>
          </div>
        )}
        <div>
          <div className="post-author">{post.author}</div>
          <div className="post-time">{timeAgo}</div>
        </div>
      </div>
      
      <div className="post-content">
        {isEditing ? (
          <textarea 
            className="edit-textarea" 
            value={editedContent} 
            onChange={(e) => setEditedContent(e.target.value)}
            autoFocus
          />
        ) : (
          <p className="post-text">{post.content}</p>
        )}
        
        {post.imageUrls?.length > 0 && (
          <div className="post-images">
            {post.imageUrls.map((url, index) => (
              <img key={index} src={url} alt="Post content" className="post-img" />
            ))}
          </div>
        )}
      </div>
      
      <div className="post-actions">
        <button 
          className={`action-btn ${post.liked ? 'liked' : ''}`} 
          onClick={() => onLike(post.id)}
          data-action="Like"
          data-count={post.likes}
        >
          <i className="fas fa-thumbs-up"></i>
          <span> ({post.likes})</span>
        </button>
        <button 
          className="action-btn" 
          onClick={() => onShare(post.id)}
          data-action="Share"
          data-count={post.shares}
        >
          <i className="fas fa-share"></i>
          <span> ({post.shares})</span>
        </button>
        <button 
          className="action-btn" 
          onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
          data-action={isEditing ? "Save" : "Edit"}
        >
          <i className={`fas fa-${isEditing ? 'save' : 'edit'}`}></i>
          <span>{isEditing ? '' : ''}</span>
        </button>
        <button 
          className="action-btn" 
          onClick={confirmDelete}
          data-action="Delete"
        >
          <i className="fas fa-trash"></i>
          <span></span>
        </button>
      </div>
      
      <button 
        className={`comments-toggle ${showComments ? 'expanded' : ''} ${darkMode ? 'dark' : ''}`} 
        onClick={() => setShowComments(!showComments)}
      >
        <span>
          <i className="fas fa-comment"></i> {post.comments?.length || 0} Comments
        </span>
        <i className="fas fa-chevron-down"></i>
      </button>
      
      <div 
        className={`post-comments ${showComments ? 'expanded' : ''} ${darkMode ? 'dark' : ''}`} 
        ref={commentsRef}
      >                                   
        <div className="comment-input">
          <input 
            type="text" 
            placeholder="Write a comment..." 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button className="comment-submit-btn" onClick={handleAddComment}>
            <i className="fas fa-paper-plane"></i> 
          </button>
        </div>
        
        {post.comments?.length > 0 ? (
          <div className="comments-list">
            {post.comments.map((comment, index) => (
              <div key={index} className="comment-text">
                {typeof comment === 'string' ? comment : comment.text}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:8080/posts");
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      }
    };
    fetchPosts();
  }, []);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      const response = await fetch("http://localhost:8080/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPost),
      });
      
      if (!response.ok) throw new Error("Failed to create post");
      
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
        text: 'Failed to create post. Please try again.',
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

  const editPost = async (id, updatedPost) => {
    try {
      const response = await fetch(`http://localhost:8080/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedPost),
      });
      const data = await response.json();
      setPosts(prevPosts => prevPosts.map(post => (post.id === id ? data : post)));
    } catch (error) {
      console.error("Error updating post:", error);
      setPosts(prevPosts => prevPosts.map(post => (post.id === id ? updatedPost : post)));
    }
  };

  const deletePost = async (id) => {
    try {
      await fetch(`http://localhost:8080/posts/${id}`, {
        method: "DELETE",
      });
      setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
    } catch (error) {
      console.error("Error deleting post:", error);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
    }
  };

  const likePost = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/posts/${id}/like`, {
        method: "PUT",
      });
      const data = await response.json();
      setPosts(prevPosts => prevPosts.map(post => (post.id === id ? { ...post, ...data, liked: true } : post)));
    } catch (error) {
      console.error("Error liking post:", error);
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { ...post, likes: post.likes + 1, liked: true } : post
      ));
    }
  };

  const sharePost = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/posts/${id}/share`, {
        method: "PUT",
      });
      const data = await response.json();
      setPosts(prevPosts => prevPosts.map(post => (post.id === id ? data : post)));
    } catch (error) {
      console.error("Error sharing post:", error);
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { ...post, shares: post.shares + 1 } : post
      ));
    }
  };

  const commentOnPost = async (id, commentText) => {
    try {
      const response = await fetch(`http://localhost:8080/posts/${id}/comment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(commentText),
      });
      const data = await response.json();
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { 
          ...post, 
          comments: [...(post.comments || []), commentText] 
        } : post
      ));
    } catch (error) {
      console.error("Error adding comment:", error);
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === id ? { 
          ...post, 
          comments: [...(post.comments || []), commentText] 
        } : post
      ));
    }
  };

  const filteredPosts = posts.filter(
    post => post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateTopUsers = () => {
    const stats = {};
    posts.forEach(post => {
      if (!stats[post.author]) {
        stats[post.author] = { likes: 0, shares: 0, comments: 0 };
      }
      stats[post.author].likes += post.likes;
      stats[post.author].shares += post.shares;
      stats[post.author].comments += post.comments?.length || 0;
    });
    return Object.entries(stats)
      .map(([author, data]) => ({ author, ...data }))
      .sort((a, b) => b.likes + b.shares + b.comments - (a.likes + a.shares + a.comments));
  };

  const totalPosts = posts.length;
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      <header className={`header ${darkMode ? 'dark' : ''}`}>
        <h1 onClick={scrollToSearch}>
          <i className="fas fa-globe"></i> FREEWALL MEDIA
        </h1>
        <button 
          className={`btn ${darkMode ? 'btn-primary' : 'btn-outline'}`}
          onClick={toggleDarkMode}
        >
          <i className={`fas fa-${darkMode ? 'sun' : 'moon'}`}></i>
          {darkMode ? ' Light Mode' : ' Dark Mode'}
        </button>
      </header>
      
      <div className="content" ref={contentRef}>
        <div className={`search-container ${darkMode ? 'dark' : ''}`} ref={searchRef}>
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search author or posts..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="analytics">
          <div className={`analytics-card ${darkMode ? 'dark' : ''}`}>
            <h3>{totalPosts}</h3>
            <p>Total Posts</p>
          </div>
          <div className={`analytics-card ${darkMode ? 'dark' : ''}`}>
            <h3>{totalLikes}</h3>
            <p>Total Likes</p>
          </div>
          <div className={`analytics-card ${darkMode ? 'dark' : ''}`}>
            <h3>{totalShares}</h3>
            <p>Total Shares</p>
          </div>
          <div className={`analytics-card ${darkMode ? 'dark' : ''}`}>
            <h3>{totalComments}</h3>
            <p>Total Comments</p>
          </div>
        </div>
        
        <div className="controls">
          <button 
            className={`btn ${showCreateForm ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <i className={`fas fa-${showCreateForm ? 'times' : 'plus'}`}></i>
            {showCreateForm ? 'Create Post' : 'Create Post'}
          </button>
          <button 
            className={`btn ${showTopUsers ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setShowTopUsers(!showTopUsers)}
          >
            <i className="fas fa-users"></i>
            {showTopUsers ? 'Popular Users' : 'Popular Users'}
          </button>
        </div>
        
        <div className={`new-post ${showCreateForm ? 'active' : ''} ${darkMode ? 'dark' : ''}`}>
          <input 
            type="text" 
            placeholder="Your name" 
            value={newPostAuthor}
            onChange={e => setNewPostAuthor(e.target.value)}
            required
          />
          <textarea 
            placeholder="What's on your mind?" 
            value={newPostContent}
            onChange={e => setNewPostContent(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="Profile picture URL (optional)" 
            value={newPostProfilePicture}
            onChange={e => setNewPostProfilePicture(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Image URLs, separated by commas (optional)" 
            value={newPostImageUrls}
            onChange={e => setNewPostImageUrls(e.target.value)}
          />
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={createPost}>
              Post
            </button>
          </div>
        </div>
        
        <div className={`top-users ${showTopUsers ? 'active' : ''} ${darkMode ? 'dark' : ''}`}>
          <h3>Top Users</h3>
          {calculateTopUsers().length > 0 ? (
            <div className="user-list">
              {calculateTopUsers().slice(0, 5).map((user, index) => (
                <div key={index} className={`user-card ${darkMode ? 'dark' : ''}`}>
                  <div className="user-header">
                    <h4>{user.author}</h4>
                    <span className="user-rank">#{index + 1}</span>
                  </div>
                  <div className="user-stats">
                    <span>
                      <i className="fas fa-thumbs-up"></i>
                      <strong>{user.likes}</strong>
                      <small>Likes</small>
                    </span>
                    <span>
                      <i className="fas fa-share"></i>
                      <strong>{user.shares}</strong>
                      <small>Shares</small>
                    </span>
                    <span>
                      <i className="fas fa-comment"></i>
                      <strong>{user.comments}</strong>
                      <small>Comments</small>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-users">No users data available</p>
          )}
        </div>
        
        <div className="posts-list">
          {filteredPosts.length === 0 ? (
            <div className={`empty-state ${darkMode ? 'dark' : ''}`}>
              {searchQuery ? (
                <>
                  <i className="fas fa-search"></i>
                  <p>No posts found matching your search</p>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <i className="fas fa-edit"></i>
                  <p>No posts yet, be the first!</p>
                </>
              )}
            </div>
          ) : (
            filteredPosts.map(post => (
              <Post 
                key={post.id}
                post={post}
                onDelete={deletePost}
                onLike={likePost}
                onShare={sharePost}
                onComment={commentOnPost}
                onEdit={editPost}
                darkMode={darkMode}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
