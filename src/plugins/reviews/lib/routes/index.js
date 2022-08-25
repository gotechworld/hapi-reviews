import QuestionsHandler from "../handlers/questions";
import ReviewsHandler from "../handlers/reviews";
import SummariesHandler from "../handlers/summaries";
import ReportsHandler from "../handlers/reports";
import StatsHandler from "../handlers/stats";
import ReviewTypesHandler from "../handlers/review_types";

const LogTag = "RoutesInject";
const LogMessage = (type, message) => {

  console[type](type.toUpperCase(), [LogTag], message);
};

exports.inject = server => {

  const routes = [
    // questions
    {
      method: "POST",
      path: "/questions",
      config: QuestionsHandler.routes.post
    },
    {
      method: "GET",
      path: "/questions/{id}",
      config: QuestionsHandler.routes.get
    },
    {
      method: "DELETE",
      path: "/questions/{id}",
      config: QuestionsHandler.routes.delete
    },
    {
      method: "PUT",
      path: "/questions/{id}",
      config: QuestionsHandler.routes.update
    },
    {
      method: "GET",
      path: "/questions",
      config: QuestionsHandler.routes.list
    },
    //review types
    {
      method: "GET",
      path: "/review_types",
      config: ReviewTypesHandler.routes.list
    },
    {
      method: "DELETE",
      path: "/review_types/{id}",
      config: ReviewTypesHandler.routes.delete
    },
    {
      method: "PUT",
      path: "/review_types/{id}",
      config: ReviewTypesHandler.routes.update
    },
    {
      method: "POST",
      path: "/review_types",
      config: ReviewTypesHandler.routes.post
    },
    // reviews
    {
      method: "POST",
      path: "/reviews",
      config: ReviewsHandler.routes.post
    },
    {
      method: "GET",
      path: "/reviews/{id}",
      config: ReviewsHandler.routes.get
    },
    {
      method: "DELETE",
      path: "/reviews/{id}",
      config: ReviewsHandler.routes.delete
    },
    {
      method: "PUT",
      path: "/reviews/{id}",
      config: ReviewsHandler.routes.update
    },
    {
      method: "GET",
      path: "/reviews",
      config: ReviewsHandler.routes.list
    },
    // summary
    {
      method: "GET",
      path: "/summaries",
      config: SummariesHandler.routes.list
    },
    // reports
    {
      method: "POST",
      path: "/reports/review",
      config: ReportsHandler.routes.postReview
    },
    {
      method: "POST",
      path: "/reports/question",
      config: ReportsHandler.routes.postQuestion
    },
    // stats
    {
      method: "GET",
      path: "/stats/today",
      config: StatsHandler.routes.get
    },
    {
      method: "GET",
      path: "/stats",
      config: StatsHandler.routes.list
    }
  ];

  LogMessage("info", `Registering ${routes.length} routes`);

  server.route(routes);
};
