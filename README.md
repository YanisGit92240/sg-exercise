Test DevOps : application full-stack containerisée, déployée automatiquement sur Azure via GitHub Actions.

**URL publique** : https://sg-frontend.bluedesert-eaead0d4.francecentral.azurecontainerapps.io

---

## Ce que j'ai construit

Une application simple, pour démontrer une chaîne DevOps de bout en bout :

- Un backend FastAPI (Python) qui expose une API REST
- Un frontend HTML statique servi par Nginx
- Le tout containerisé avec Docker
- Déployé automatiquement sur Azure Container Apps à chaque push sur main
- Scalable : de 1 à 5 replicas selon le trafic


## Stack technique

 - Backend = FastAPI + Uvicorn : Léger, rapide, habitude d'utilisation
 - Frontend = HTML + Nginx : Frontend vraiment basique, NGINX parfait pour du statique
 - Containerisation = Docker : Habitude d'utilisation
 - Docker Compose = Lance les deux services en une commande 
 - CI/CD = GitHub Actions : Natif GitHub, gratuit, habitude d'utilisation
 - Cloud = Azure Container Apps
 - Load testing = k6 : Outil Go, léger, scripting en JS, première fois que je l'utilisais

### Prérequis

- Docker Desktop installé et lancé
- Git

### Démarrage

Ouvrir un terminal de commande et écrire les commandes : 

git clone https://github.com/YanisGit92240/sg-exercise.git
cd sg-exercise
docker compose up --build


- Frontend : http://localhost:3000
- Backend : http://localhost:8000
- Swagger : http://localhost:8000/docs

### Ce qui se passe au démarrage

Docker Compose lance deux containers. Le frontend attend que le backend soit `healthy` avant de démarrer — c'est le `depends_on` avec `condition: service_healthy` dans le `docker-compose.yml`. Le health check appelle `/health` toutes les 10 secondes pour vérifier que le backend répond. Une fois les deux containers up, le frontend appelle le backend et affiche le message retourné.

## Architecture du code

### Backend — `backend`
backend/
- main.py           # Application FastAPI
- requirements.txt  # Dépendances Python
- Dockerfile        # Image Docker

**`main.py`** expose deux routes :
- `GET /health` — retourne `{"status": "ok"}`, utilisé par Docker et Azure pour savoir si le service est vivant
- `GET /api/message` — retourne un message configurable via la variable d'environnement `APP_MESSAGE`

Les logs sont structurés avec le module `logging` de Python. Sur Azure, ces logs remontent automatiquement dans Azure Monitor.

**`Dockerfile`** — l'ordre des instructions est important :

```dockerfile
FROM python:3.11-slim        # image légère, pas la full
WORKDIR /app
COPY requirements.txt .      # copié AVANT le code
RUN pip install ...          # cette couche est cachée si requirements.txt n'a pas changé
COPY . .                     # le code arrive en dernier
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

En copiant `requirements.txt` avant le code source, si je modifie uniquement `main.py`, Docker réutilise la couche d'installation des dépendances. Le build pest donc beaucoup plus rapide, puisqu'on a pas besoins de réinstaller les dépendances

### Frontend — `frontend`

- index.html    # Page HTML, appelle du back en JS
- nginx.conf    # Configuration Nginx
- Dockerfile    # Image Docker

Le frontend est volontairement très basique : une page HTML avec du JavaScript qui appelle le backend au chargement. Nginx sert ce fichier statique et expose un endpoint `/health` qui retourne 200 immédiatement.

L'URL du backend est détectée à l'exécution :
- Si on est sur `localhost` → appel sur `http://localhost:8000`
- Sinon → appel sur l'URL Azure du backend

### Docker Compose — local uniquement

Le `docker-compose.yml` est réservé au développement local. En production, chaque service est déployé indépendamment sur Azure Container Apps — pas besoin de Compose en prod.


## CI/CD — GitHub Actions

Le pipeline est dans `.github/workflows/deploy.yml`. Il se déclenche automatiquement à chaque push sur `main`.

### Structure du pipeline
push sur main

Job 1 : build-and-push
 Checkout du code
 Login Docker Hub
 Build image backend, push sur Docker Hub
 Build image frontend, push sur Docker Hub
│
▼ (seulement si Job 1 réussit)
Job 2 : deploy
 Checkout du code
 Login Azure 
 Installation extension containerapp
 Deploy backend 
 Deploy frontend
 Affichage URL publique


### Gestion des secrets

Aucun credential n'est dans le code. Tout est dans GitHub Secrets :


### Pourquoi Azure Container Apps ?

J'ai choisi Container Apps pour ces raisons :

- **Pas de gestion de serveurs** : je déploie une image, Azure gère le reste
- **Facturation à l'usage** : on paie uniquement les requêtes traitées, pas un serveur qui tourne à vide
- **Habitude d'usagede l'environnement azure** : L'EFREI est partenaire à Microsoft


### Autoscaling

Azure Container Apps scale automatiquement selon le nombre de requêtes HTTP simultanées. La règle configurée : un nouveau replica est créé quand il y a plus de 20 requêtes simultanées sur un replica. Entre 1 et 5 replicas pour le backend, 1 et 3 pour le frontend.



### Lancer le test

Ouvrir deux terminaux de commande et ecrire dans le premier :

k6 run -e TARGET_URL=https://sg-backend.bluedesert-eaead0d4.francecentral.azurecontainerapps.io k6/load-test.js


### Scénario

- 0 -> 10 users sur 30s : montée douce
- 10 ->50 users sur 1 min : charge normale
- 50 -> 100 users sur 30s : pic
- 100 -> 0 sur 30s : descente

### Observer le scaling en temps réel

Dans un terminal séparé pendant le test :


watch -n 5 "az containerapp replica list --name sg-backend --resource-group sg-exercise-rg --query '[].name' -o tsv"


On voit le nombre de replicas augmenter de 1 à plusieurs pendant le pic, puis redescendre après la fin du test.


## Observabilité

Les logs du backend sont accessibles en temps réel :
Dans un terminal ecrire :

az containerapp logs show \
  --name sg-backend \
  --resource-group sg-exercise-rg \
  --follow

Chaque requête HTTP est loggée avec son statut. Azure Monitor agrège ces logs et permet de créer des dashboards et des alertes.
## Les limites de mon projet

- Pas de base de données : le state est en mémoire uniquement, il est perdu au redémarrage du container
- L'URL publique est celle d'Azure par défaut, pas un custom domain
- Pas de tests unitaires dans le pipeline CI : le code est déployé sans vérification automatisée

## Ce que j'aurais fait avec plus de temps

- **Azure Key Vault** pour les secrets plutôt que des variables d'environnement directes
- **Tests unitaires** dans le pipeline CI 
