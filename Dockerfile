FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml files to the working directory
COPY ./package.json /app/

# Copy the rest of the application files to the working directory
COPY . /app
COPY .env.production .env

## Install dependencies

RUN npm install

# Build the application
RUN npm run build

# Runtime defaults. Docker Compose can override these from .env.local.
 ENV HOST=0.0.0.0 \
 NITRO_HOST=0.0.0.0 \
 PORT=4455 \
 NODE_ENV=production

# Expose the port the application will run on
EXPOSE 4455

# Start the application
CMD ["npm", "run", "start"]
