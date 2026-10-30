# Task Manager API

A small task-management REST API built with Java 21, Spring Boot, Spring Data JPA, and PostgreSQL.

## Requirements

- Java 21+
- Docker Compose
- Maven 3.9+

## Run the application and database

Build the application image and start the API and PostgreSQL together:

```shell
docker compose up --build -d
```

Compose waits for PostgreSQL to be healthy before starting the API. The API listens on `http://localhost:8080` and the database on `localhost:5432`. The default database and credentials are `task_manager`, `task_manager`, and `task_manager`; override them with `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` if needed.

The task manager interface runs in its own Nginx container at <http://localhost:3001>. It proxies API requests to the Java app container, which remains available at <http://localhost:8080>; Swagger API documentation is at <http://localhost:8080/swagger-ui/index.html>. You can create, edit, complete, search, filter, and delete tasks from the frontend.

## API documentation

- Swagger UI: <http://localhost:8080/swagger-ui/index.html>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks` | List all tasks |
| `GET` | `/api/tasks/{id}` | Get a task |
| `PUT` | `/api/tasks/{id}` | Replace a task |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

Tasks have a required `title` and `status` (`TODO`, `IN_PROGRESS`, or `DONE`), and optional `description` and `dueDate` (`YYYY-MM-DD`).

Example request:

```json
{
  "title": "Read the module brief",
  "description": "Note the project requirements",
  "status": "TODO",
  "dueDate": "2026-11-01"
}
```

## Run tests

```shell
mvn test
```

Tests use an in-memory H2 database and do not require Docker or a running PostgreSQL server.

## Stop the application and database

```shell
docker compose down
```

Use `docker compose down -v` to also remove the persisted database volume.

## Run tests locally

```shell
mvn test
```

Tests use an in-memory H2 database and do not require Docker or a running PostgreSQL server.
