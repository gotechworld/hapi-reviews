module.exports = {

  getReportReviewTemplate(review, destination) {

    const params = {
      status: review.status,
      rating: review.rating,
      body: review.body,
      product_id: review.productId,
      seller_id: review.sellerId,
      date: review.date,
      verified_buyer: review.verifiedBuyer || false,
      upvotes: review.upvotes || false,
      downvotes: review.downvotes || false,
      website_code: review.context.websiteCode || false,
      order: review.context.incrementId || false,
      customer_id: review.customer.id || false,
      customer_name: review.customer.name || false,
      customer_email: review.context.customerEmail || false
    };

    return {
      destination,
      subject: `New report for review #${review._id}`,
      type: "email",
      template_type: "report_reviews",
      params,
      request_id: "review_" + Date.now(),
      order_related: false
    };
  },

  getReportQuestionTemplate(question, destination) {

    const params = {
      status: question.status,
      body: question.body,
      product_id: question.productId,
      seller_id: question.sellerId,
      date: question.date,
      upvotes: question.upvotes || false,
      website_code: question.context.websiteCode || false,
      order: question.context.incrementId || false,
      customer_id: question.customer.id || false,
      customer_name: question.customer.name || false,
      customer_email: question.context.customerEmail || false
    };

    return {
      destination,
      subject: `New report for question #${question._id}`,
      type: "email",
      template_type: "report_reviews",
      params,
      request_id: "question_" + Date.now(),
      order_related: false
    };
  },

  getMerchandiserTemplate(reviewsData, questionsData, destination) {

    const cntReviews = Object.keys(reviewsData).length;
    const cntQuestions = Object.keys(questionsData).length;
    const params = {};
    if (cntReviews > 0) {
      params.reviews = reviewsData;
    }

    if (cntQuestions > 0) {
      params.questions = questionsData;
    }

    return {
      destination,
      subject: "Raport recenzii/intrebari",
      type: "email",
      template_type: "report_merchandisers",
      params,
      request_id: "review_" + Date.now(),
      order_related: false
    };
  },

  /** template for email sent when a review is approved */
  getReviewApprovedTemplate(reviewData, destination) {
    const params = {};
    params.customer_name = reviewData.customer.name;

    return {
      destination,
      subject: "Review-ul tău contează",
      type: "email",
      template_type: "review_approved",
      params,
      request_id: "review_" + reviewData._id + Date.now(),
      order_related: false
    };
  }
};
