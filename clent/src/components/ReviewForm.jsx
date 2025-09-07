import React, { useState } from "react";
import { useAddReview } from "../hooks/useBlockchain";
import { MessageSquarePlus, Star } from "lucide-react";

const AddReviewForm = ({ productId, user }) => {
  const addReview = useAddReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment) return;
    await addReview(productId, rating, comment, user);
    setRating(0);
    setComment("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border rounded-lg shadow bg-black/50"
    >
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <MessageSquarePlus className="w-5 h-5 text-blue-600" />
        Add Review
      </h3>

      {/* Clickable Stars */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-6 h-6 cursor-pointer transition-colors ${
                star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
              }`}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>

      {/* Comment box */}
      <div className="mb-2">
        <label className="block text-sm font-medium">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Write your review..."
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Submit
      </button>
    </form>
  );
};

export default AddReviewForm;
