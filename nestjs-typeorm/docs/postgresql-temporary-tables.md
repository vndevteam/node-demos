# Demo: Using PostgreSQL Temporary Tables with NestJS & TypeORM

## Purpose

This document describes the main features of the demo project that showcases how to use temporary tables in PostgreSQL with NestJS and TypeORM.

## Main Features

### 1. Creating Temporary Tables in PostgreSQL

- The system allows creating temporary tables during query execution.
- Temporary tables exist only within the current session and are automatically dropped when the session ends.

### 2. Operations on Temporary Tables

- Insert, update, and delete data in temporary tables.
- Query data from temporary tables for temporary business logic such as batch processing, data aggregation, or testing.

### 3. Integration with NestJS & TypeORM

- Use TypeORM's QueryRunner to perform operations on temporary tables via raw SQL queries.
- Services and controllers demonstrate how to create and use temporary tables within the NestJS application flow.

### 4. Usage Examples

- Create a temporary table to store request-specific data.
- Perform calculations or aggregations on temporary table data.
- Return results to the client without affecting the main database data.

## Benefits

- Enables temporary data processing without modifying actual system data.
- Improves performance for batch tasks or large data processing.
- Ensures data isolation and safety within each session.

## Notes

- Temporary tables exist only for the current database session.
- Do not use temporary tables for data that needs to be stored long-term.

## References

- [PostgreSQL Temporary Tables Documentation](https://www.postgresql.org/docs/current/sql-createtable.html)
- [TypeORM QueryRunner](https://typeorm.io/query-runner)
- [NestJS Documentation](https://docs.nestjs.com/)
