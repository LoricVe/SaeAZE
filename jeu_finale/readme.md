# Projet API

## Prérequis

* Node.js (v14 ou supérieur)
* npm
* Une base de données (MySQL, PostgreSQL ou MongoDB)
* Vous pouvez installer Xampp pour avoir une base de données en local

## Dépendances principales

* **axios**: ^1.8.4 - Pour les requêtes HTTP
* **cors**: ^2.8.5 - Gestion des requêtes cross-origin
* **dotenv**: ^16.3.1 - Gestion des variables d'environnement
* **express**: ^4.18.2 - Framework web
* **mariadb**: ^3.4.0 - Pilote de base de données MariaDB
* **mysql2**: ^3.6.0 - Pilote de base de données MySQL
* **node-fetch**: ^3.3.2 - Bibliothèque de requêtes réseau
* **sequelize**: ^6.37.7 - Framework ORM
* **swagger-jsdoc**: ^6.2.8 - Génération de documentation Swagger
* **swagger-ui-express**: ^5.0.1 - Interface utilisateur Swagger
* **wikipedia**: ^2.1.2 - Client API Wikipedia

## Dépendances de développement

* **jest**: ^29.7.0 - Framework de test
* **nodemon**: ^3.0.1 - Redémarrage automatique du serveur en développement
* **supertest**: ^6.3.4 - Outil de test HTTP

## Installation

### 1. Cloner le dépôt

```bash
git clone [URL_DU_DEPOT]
cd [NOM_DU_PROJET]
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

Créez un fichier `.env` à la racine du projet avec le contenu suivant:

```
PORT=3000
DATABASE_URL=votre_url_de_connexion_a_la_bd
```

## Utilisation

### Lancer le serveur de développement

```bash
npm run dev
```

Le serveur sera accessible à l'adresse: http://localhost:3000

### Exécuter les tests

```bash
npm test
```

## Documentation API

La documentation de l'API est disponible via Swagger à l'adresse:
http://localhost:3000/api-docs
