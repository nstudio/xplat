FROM ubuntu:18.04

WORKDIR '/xplat'

COPY . .

RUN chmod +x ./scripts/*.sh
RUN ./scripts/docker-npm-setup.sh

# keep container opened during development
CMD tail -f /dev/null