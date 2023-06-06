## Description

This is a nestjs prisma webpack starter template incorporating some useful libraries such as .env variable validator, logger etc with proper linting enforcement. It also contains webhook flow using paystack as an example.

## Install Dependencies

First, clone the repo to your working directory. Make sure you have pnpm globally installed in your system. Run the below command

```bash
$ pnpm install
```

## Install husky

```bash
$ pnpm husky:install
```

## Running the app

```bash
# development
$ pnpm start:dev

# production mode
$ pnpm start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```
