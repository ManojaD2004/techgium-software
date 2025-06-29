# Access Redis Cli
docker run -it --network host --rm redis redis-cli -h localhost -a techgium

# Misc Redis
docker build -t test-redis -f dockerfile.redis ./
docker run -p 6379:6379 -it --rm  -v cache-data:/data test-redis

# Access Postgres SQL CLI
docker run -it --rm --network host -e PGPASSWORD='techgium' postgres psql -h localhost -U postgres -d techgium

# Run Docker Compose
docker compose -f ./docker/docker-compose.yml -p techgium up --build

docker compose -p test -f docker-compose.test.yml  up

# Run Ngrok Tunnel
ngrok http --url=profound-adequate-salmon.ngrok-free.app localhost:9000

# Run pm2 for scaling NodeJS with zero downtime 
pm2 start server -i max

pm2 reload server

# Python
docker build -t model-py -f dockerfile.python ./


# Todo:
# Take care of company work hours
