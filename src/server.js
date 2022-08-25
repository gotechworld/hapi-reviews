import {startApp, loadManifest} from "./utils";

// start app
startApp(loadManifest(), { relativeTo: __dirname });