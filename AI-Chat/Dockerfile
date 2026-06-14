# Étape 1 : Build
FROM node:20-alpine AS build
WORKDIR /app

# Installer compatibilité glibc pour SWC
RUN apk add --no-cache libc6-compat

# Copier uniquement les fichiers nécessaires pour installer les dépendances
COPY package*.json ./
RUN npm ci

# Copier le reste du code
COPY . .

# Construire l'application Next.js
RUN npm run build

# Étape 2 : Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Installer compatibilité glibc pour SWC
RUN apk add --no-cache libc6-compat

# Copier uniquement le build et les fichiers nécessaires
COPY --from=build /app/package*.json ./
COPY --from=build /app/.next ./.next
#COPY --from=build /app/public ./public
# Copier les fichiers de configuration nécessaires

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 3000
CMD ["npm", "run", "start"]
