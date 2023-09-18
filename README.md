## Description

This is the core service of Afribeta App. The API currently support all the functionalities that powers the app.

## Install Dependencies

First, clone the repo to your working directory. Make sure you have pnpm globally installed on your system. Run the below command

```bash
$ npm install
```

## Install husky

```bash
$ npm run husky:install
```

## Running the app

```bash
# development/watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ pnpm test

# e2e tests
$ pnpm test:e2e

# test coverage
$ pnpm test:cov
```
