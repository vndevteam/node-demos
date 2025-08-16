<p align="center">
  <a href="/">
    <img src="https://avatars.githubusercontent.com/u/105472712?s=72&v=4" alt="VNDevTeam" width=72 height=72>
  </a>

  <h3 align="center">Node.js Demos</h3>
</p>

## Description

This repository contains various demo projects built with Node.js. It serves as a collection of sample applications, boilerplates, and best practices for Node.js development. The goal is to provide easy reference and quick setup for different Node.js frameworks and use cases, helping developers learn and experiment with Node.js technologies.

## Project Structure

```
node-demos/
├── nestjs/         # Main NestJS demo project
├── nestjs-auth/    # Authentication demo with NestJS and TypeORM
├── docker/         # Docker compose files for local development
├── commitlint.config.js
├── package.json
├── README.md
└── ...
```

## Demo Projects

- [NestJS Boilerplate](https://github.com/vndevteam/nestjs-boilerplate): Starter template for NestJS projects.
- [Base NestJS](https://github.com/vndevteam/node-demos/tree/main/nestjs): Basic NestJS setup.
- [NestJS Authentication](https://github.com/vndevteam/node-demos/tree/main/nestjs-auth): Authentication with NestJS and TypeORM.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- Docker (for local database setup)

### Installation

Clone the repository:

```bash
git clone https://github.com/vndevteam/node-demos.git
cd node-demos
```

Install dependencies for each project:

```bash
cd nestjs
pnpm install
# or
cd nestjs-auth
pnpm install
```

### Running the Project

Start the NestJS server:

```bash
pnpm start
```

For authentication demo:

```bash
cd nestjs-auth
pnpm start
```

### Using Docker

To start local databases (MySQL/PostgreSQL):

```bash
docker-compose -f docker/docker-compose_mysql.local.yml up -d
# or
docker-compose -f docker/docker-compose-postgresql.local.yml up -d
```

## License

This project is licensed under the MIT License.
