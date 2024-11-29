import './App.css';
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

//star rating 
const StarRating = ({ rating, onClick, isEditable }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div style={{ display: "flex" }}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          style={{
            cursor: isEditable ? "pointer" : "default",
            color: i < (isEditable ? hoverRating || rating : rating) ? "#00FFFF" : "#ccc",
            fontSize: "24px",
            transition: "color 0.3s, transform 0.2s, text-shadow 0.2s",
            margin: "0 2px",
            textShadow: i < (isEditable ? hoverRating || rating : rating) ? "0 0 5px #00FFFF" : "none",
          }}
          onClick={isEditable ? () => onClick(i + 1) : undefined}
          onMouseEnter={() => isEditable && setHoverRating(i + 1)}
          onMouseLeave={() => isEditable && setHoverRating(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

//styles
const gradientBackground = {
  background: "linear-gradient(to bottom right, #121212, #1a1a1a, #282828)",
  minHeight: "100vh",
  width: "100vw",
  padding: "0",
  fontFamily: "'Roboto Mono', monospace",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  overflow: "hidden",
};

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  width: "100%",
  maxWidth: "900px",
  padding: "40px",
  borderRadius: "12px",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(15px)",
  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.7)",
};

const reviewContainerStyle = {
  backgroundColor: "transparent",
  padding: "0px",
  marginBottom: "30px",
  width: "100%",
  position: "relative",
  animation: "fadeInLeft 0.8s ease forwards",
  transition: "transform 0.3s",
};

const dateStyle = {
  position: "absolute",
  top: "10px",
  right: "20px",
  fontSize: "14px",
  color: "#ddd",
};

const buttonStyle = {
  backgroundColor: "#00FFFF",
  color: "#121212",
  padding: "10px 20px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "16px",
  transition: "all 0.3s ease",
  marginTop: "15px",
  marginRight: "20px",
  boxShadow: "0 4px 8px rgba(0, 255, 255, 0.5)",
};

const selectStyle = {
  padding: "12px",
  marginRight: "15px",
  borderRadius: "6px",
  backgroundColor: "#222",
  color: "#fff",
  border: "none",
  appearance: "none",
};

//keyframes for animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `@keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }`,
  styleSheet.cssRules.length
);

const App = () => {
  const [reviews, setReviews] = useState([]);
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({
    bookTitle: "",
    author: "",
    rating: 1,
    reviewText: "",
  });

  const formRef = useRef(null);  //reference to the form

  useEffect(() => {
    fetchReviews(); //initial fetch when the page loads
  }, []); 
  
  useEffect(() => {
    fetchReviews();
  }, [ratingFilter, sortOrder]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get("http://localhost:5000/reviews", {
        params: {
          rating: ratingFilter || undefined,
          sort: sortOrder,
        },
      });
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        await axios.put(
          `http://localhost:5000/reviews/${editingReview._id}`,
          formData,
        );
        setEditingReview(null);
      } else {
        await axios.post("http://localhost:5000/reviews", formData);
      }
      setFormData({ bookTitle: "", author: "", rating: 1, reviewText: "" });
      fetchReviews();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await axios.delete(`http://localhost:5000/reviews/${id}`);
        fetchReviews();
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      bookTitle: review.bookTitle,
      author: review.author,
      rating: review.rating,
      reviewText: review.reviewText,
    });

    //scroll to the form
    formRef.current.scrollIntoView({ behavior: "smooth" });  
  };

  return (
    <div style={gradientBackground}>
      <h1
        style={{
          textAlign: "center",
          marginBottom: "40px",
          fontSize: "32px",
          textShadow: "0 0 10px #00FFFF",
        }}
      >
        Book Reviews
      </h1>

      <div style={containerStyle}>
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}>
          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(e.target.value ? parseInt(e.target.value, 10) : "")
            }
            style={selectStyle}
          >
            <option value="">All Ratings</option>
            <option value="1">1 Star</option>
            <option value="2">2 Stars</option>
            <option value="3">3 Stars</option>
            <option value="4">4 Stars</option>
            <option value="5">5 Stars</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={selectStyle}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/*review form*/}
        <div style={reviewContainerStyle}>
          <h2>{editingReview ? "Edit Review" : "Write a Review"}</h2>
          <form onSubmit={handleFormSubmit} ref={formRef}>
            <input
              type="text"
              placeholder="Book Title"
              value={formData.bookTitle}
              onChange={(e) =>
                setFormData({ ...formData, bookTitle: e.target.value })
              }
              required
              style={{
                padding: "12px",
                margin: "10px 0",
                width: "100%",
                borderRadius: "6px",
                backgroundColor: "#333",
                color: "#fff",
                border: "none",
              }}
            />
            <input
              type="text"
              placeholder="Author"
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
              required
              style={{
                padding: "12px",
                margin: "10px 0",
                width: "100%",
                borderRadius: "6px",
                backgroundColor: "#333",
                color: "#fff",
                border: "none",
              }}
            />
            <StarRating
              rating={formData.rating}
              onClick={(rating) =>
                setFormData({ ...formData, rating })
              }
              isEditable
            />
            <textarea
              placeholder="Write your review here"
              value={formData.reviewText}
              onChange={(e) =>
                setFormData({ ...formData, reviewText: e.target.value })
              }
              required
              rows="4"
              style={{
                padding: "12px",
                margin: "10px 0",
                width: "100%",
                borderRadius: "6px",
                backgroundColor: "#333",
                color: "#fff",
                border: "none",
              }}
            />
            <button type="submit" style={buttonStyle}>
              {editingReview ? "Save Changes" : "Submit Review"}
            </button>
          </form>
        </div>

        {/*reviews*/}
        <div>
          {reviews.map((review) => (
            <div key={review._id} style={reviewContainerStyle}>
              <h3>{review.bookTitle} by {review.author}</h3>
              <StarRating rating={review.rating} onClick={() => {}} />
              <p>{review.reviewText}</p>
              <div style={dateStyle}>
                <small>{new Date(review.dateAdded).toLocaleDateString()} at {new Date(review.dateAdded).toLocaleTimeString()}</small>
              </div>
              <button onClick={() => handleEdit(review)}>
                Edit
              </button>
              <button onClick={() => handleDelete(review._id)}>
                Delete
              </button>
              <hr style={{ height: "2px", background: "linear-gradient(to right, #00FFFF, #ff00ff)", margin: "20px 0", border: "none" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
