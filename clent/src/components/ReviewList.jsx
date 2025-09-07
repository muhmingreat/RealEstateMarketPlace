import React from "react";
import { useLikeReview } from "../hooks/useBlockchain";
import { ThumbsUp, Star, User } from "lucide-react";

const ReviewList = ({ productId, reviews, user }) => {
  const likeReview = useLikeReview();

  const handleLike = async (index) => {
    await likeReview(productId, index, user);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold mb-3">Reviews</h3>
      {reviews?.length > 0 ? (
        reviews.map((review, index) => (
          <div
            key={index}
            className="p-3 border-b flex justify-between items-center"
          >
            <div>
              <p className="flex items-center gap-1 font-semibold">
                <Star className="w-4 h-4 text-yellow-500" />
                {review.rating}
              </p>
              <p>{review.comment}</p>
              <small className="text-gray-500 flex items-center gap-1">
                <User className="w-4 h-4" /> {review.user}
              </small>
            </div>
            <button
              onClick={() => handleLike(index)}
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ThumbsUp className="w-4 h-4" /> {review.likes}
            </button>
          </div>
        ))
      ) : (
        <p>No reviews yet</p>
      )}
    </div>
  );
};

export default ReviewList;
