# sg-exercise

Exercice technique DevOps — application full-stack containerisée et déployée sur Azure.

## Ce que j'ai construit

Un backend FastAPI (Python) exposant une API REST, servi par un frontend HTML/Nginx.
Le tout containerisé avec Docker et déployé automatiquement sur Azure Container Apps via GitHub Actions.

## Stack

- Backend : FastAPI + Uvicorn
- Frontend : HTML statique + Nginx
- CI/CD : GitHub Actions
- Cloud : Azure Container Apps (francecentral)
- Registry : Docker Hub
- Load testing : k6

## Lancer en local

```bash
docker compose up --build
```

- Frontend : http://localhost:3000
- Backend : http://localhost:8000
- Swagger : http://localhost:8000/docs

## Comment ça se déploie

Chaque push sur `main` déclenche le pipeline :
1. Build des images Docker backend et frontend
2. Push sur Docker Hub
3. Déploiement sur Azure Container Apps

Les secrets (credentials Azure, Docker) sont stockés dans GitHub Secrets et jamais dans le code.

## Load testing

```bash
k6 run -e TARGET_URL=https://sg-frontend.bluedesert-eaead0d4.francecentral.azurecontainerapps.io k6/load-test.js
```

Le script simule une montée de 0 à 100 utilisateurs sur 2 minutes, puis redescend.
Azure Container Apps scale automatiquement de 1 à 5 replicas selon le trafic HTTP.

## Choix techniques

**Azure Container Apps** plutôt que AKS : je n'avais pas besoin de la complexité de Kubernetes pour cet exercice. Container Apps gère l'autoscaling HTTP nativement et c'est suffisant.

**FastAPI** : génère la doc Swagger automatiquement, pratique pour montrer que l'API fonctionne sans outil externe.

**Nginx** pour le frontend : pas de Node.js, pas de build step, juste du HTML servi proprement.

## Limitations connues

- Pas de base de données (state en mémoire uniquement)
- Pas de custom domain, l'app tourne sur le domaine Azure par défaut
- Les logs sont dans Azure Monitor mais pas d'alertes configurées

## Ce que j'aurais fait avec plus de temps

- Azure Key Vault pour les secrets plutôt que des variables d'environnement
- Tests unitaires dans le pipeline CI
- Un vrai monitoring avec alertes (seuils CPU/mémoire)
- HTTPS avec un custom domain