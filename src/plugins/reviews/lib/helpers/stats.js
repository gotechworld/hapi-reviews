module.exports = {
  // Get stat object prefilled
  async getStatObject(query, ReviewModel, QuestionModel) {

    const dataObject = { today: {}, total: {} };

    // today
    dataObject.today.reviews = await ReviewModel.countDocuments(query);
    dataObject.today.questions = await QuestionModel.countDocuments(query);
    dataObject.today.approvedReviews = await ReviewModel.countDocuments({ ...query, status: true });
    dataObject.today.approvedQuestions = await QuestionModel.countDocuments({ ...query, status: true });

    //total
    dataObject.total.reviews = await ReviewModel.countDocuments();
    dataObject.total.questions = await QuestionModel.countDocuments();
    dataObject.total.approvedReviews = await ReviewModel.countDocuments({ status: true });
    dataObject.total.approvedQuestions = await QuestionModel.countDocuments({ status: true });

    return dataObject;
  }
};
