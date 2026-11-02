import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tableflow API',
      version: '1.0.0',
      description: 'Restaurant management system — waiter, customer, and admin endpoints.',
    },
    servers: [{ url: '/api/v1', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.routes.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);