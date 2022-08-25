module.exports = {
  // Get current date
  getDate(dateStr, suffix, subtractNoDays) {

    let dateObj = new Date();
    if (dateStr) {
      dateObj = new Date(dateStr);
    }

    let day = dateObj.getDate();
    if (subtractNoDays) {
      day = dateObj.getDate() - subtractNoDays;
    }

    const date = ("0" + day).slice(-2);
    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const year = dateObj.getFullYear();

    let time = "";
    if (suffix === "start") {
      time = "00:00:00";
    }
    else if (suffix === "end") {
      time = "23:59:59";
    }
    else {
      const seconds = ("0" + dateObj.getSeconds()).slice(-2);
      const minutes = ("0" + dateObj.getMinutes()).slice(-2);
      const hours = ("0" + dateObj.getHours()).slice(-2);

      time = `${hours}:${minutes}:${seconds}`;
    }

    return `${year}-${month}-${date} ${time}`;
  },

  preventMultipleIncrements(dataObject, request, currentObject) {
    let previousUpvote = false;
    let previousDownvote = false;
    let previousQuestion = false;

    previousUpvote = currentObject.community.customers_upvoting.includes(request.payload.communityCustomerId);
    previousDownvote = currentObject.community.customers_downvoting.includes(request.payload.communityCustomerId);
    if (currentObject.customers_sameQuestion) {
      previousQuestion = currentObject.customers_sameQuestion.includes(request.payload.communityCustomerId);
    }

    if ((request.payload.upvotes > 0 && previousUpvote) ||
      (request.payload.upvotes < 0 && !previousUpvote) ||
      (request.payload.downvotes > 0 && previousDownvote) ||
      (request.payload.downvotes < 0 && !previousDownvote) ||
      (request.payload.sameQuestion > 0 && previousQuestion) ||
      (request.payload.sameQuestion < 0 && !previousQuestion)) {
        delete dataObject.$push;
        delete dataObject.$inc;
    }

    return dataObject;
  }
};
