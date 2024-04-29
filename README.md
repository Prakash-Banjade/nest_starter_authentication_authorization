# <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="50" alt="Nest Logo" /></a> NestJS Authentication and Authorization Starter

Welcome to the NestJS Authentication and Authorization Starter repository! This starter template provides a robust foundation for building authentication and authorization systems using NestJS, a progressive Node.js framework.

## Features

### Authentication
1. **JWT Access and Refresh Token Rotation**: Implementing a fully functional JWT access token and refresh token rotation strategy ensures secure and efficient authentication.
2. **Global Authentication Guard**: Protect your routes with a global authentication guard to ensure that only authenticated users can access protected resources.
3. **Custom Decorator for Public Routes**: Easily make any route public by using a custom decorator, providing flexibility in defining which routes require authentication.

### Authorization
1. **CASL Authorization Library**: Utilize CASL, an isomorphic authorization library, to implement fine-grained access control based on user roles and permissions.
2. **Global Ability Guard**: Apply a global ability guard to enforce authorization rules across your application, ensuring that users only access resources they are authorized to.
3. **Custom Decorator for Ability Metadata**: Configure granular access control by using a custom decorator to define ability metadata for routes and resources.

### NestJS Application Setup
1. **CORS Configuration**: Cross-Origin Resource Sharing (CORS) setup is included to facilitate communication between frontend and backend components.
2. **Swagger Setup**: Easily document and test your API endpoints with Swagger setup, providing a user-friendly interface for developers to interact with your API.
3. **Global Exception Filter**: Handle exceptions gracefully with a global exception filter, improving error handling and providing a consistent user experience.
4. **TypeORM Module**: Integrate TypeORM, a powerful Object-Relational Mapping (ORM) library, for seamless database interactions and entity management.
5. **Global Validation Filter**: Ensure data integrity by implementing a global validation filter, validating incoming requests against defined schemas.
6. **Default User Entity**: Get started quickly with a default User entity, including essential fields for authentication and authorization.
7. **NestJSFormDataModule Configuration for File Upload**: Easily handle file uploads by configuring NestJSFormDataModule, simplifying the process of managing file uploads within your application.
8. **Database Setup in Local Docker Container**: The database is set up in a local Docker container. Configuration details can be found in the `docker-compose.yml` file.
9. **Class-validator Library for Endpoints Data Validation**: Implement robust data validation for your endpoints using the class-validator library.

## Getting Started

To get started with this starter template, follow these steps:

1. Create a new repository with this template by clicking the `Use this template` button on top right of <>Code section.
2. Clone your newly create repository.
3. Install dependencies using `npm install`.
4. Customize the provided User entity or create your own entities as needed.
5. Configure authentication and authorization settings based on your application requirements.
6. Start building your NestJS application by defining routes, controllers, and services.

## .env file configuration

```bash
DATABASE_URL=mysql://<db_user>:<db_password>@localhost:3306/<db_name>

ACCESS_TOKEN_SECRET=

REFRESH_TOKEN_SECRET=
```  

## Contributing

Contributions from the community are welcomed! If you have any suggestions, improvements, or bug fixes, feel free to open an issue or submit a pull request.

## Security

For information on security-related matters, including reporting vulnerabilities and responsible disclosure guidelines, please refer to the [SECURITY.md](SECURITY.md) file.

## License

This project is licensed under the [MIT License](LICENSE).
