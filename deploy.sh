#!/bin/sh
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build -t michaelshmitty/cassandra .
docker image push michaelshmitty/cassandra
docker-compose -H "ssh://root@voidwarranties" pull
docker-compose -H "ssh://root@voidwarranties" up --force-recreate -d
docker -H "ssh://root@voidwarranties" image prune -f
