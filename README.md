# HAPI - Reviews API

Reviews aggregator for:

- products
- sellers

Starting up the project:

- install docker and docker compose
- issue a `docker-compose up` command
- exposed port is 4650 as stated in the project's manifest.json.dist file and forwarded through docker-compose.yml from the app container

## NPM commands

````
start -> start in dev mode
build -> transpile src code with babel resulting the build into dist file (prod)
serve -> serve the transpiled build (prod)
command:aggregate-summaries -> run aggregate command from dist (prod)
dev:command:aggregate-summaries -> run aggregate command with babel from not transpiled folder (src) (dev mode)
```
````
