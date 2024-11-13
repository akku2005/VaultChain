'use strict';
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class RouteLoader {
  constructor(app, options = {}) {
    this.app = app;
    this.routesPath = options.routesPath || path.join(__dirname, '../routes');
    this.basePrefix = options.basePrefix || '/api/v1';
    this.fileFilter = options.fileFilter || this.defaultFileFilter;
  }

  // Default file filter to include only route files
  defaultFileFilter(file) {
    return file.endsWith('.route.js') || file.endsWith('.routes.js') || file.endsWith('.router.js');
  }

  loadRoutes() {
    try {
      // Ensure routes directory exists
      if (!fs.existsSync(this.routesPath)) {
        logger.warn('Routes directory does not exist', { path: this.routesPath });
        return;
      }

      // Read route files
      const routeFiles = fs.readdirSync(this.routesPath).filter(this.fileFilter);

      // Load and register routes
      routeFiles.forEach((file) => {
        try {
          const routeFilePath = path.join(this.routesPath, file);
          const route = this.loadRouteModule(routeFilePath);

          // Validate route module
          if (!this.isValidRoute(route)) {
            logger.warn(`Invalid route module: ${file}`, { route });
            return;
          }

          // Construct full path with base prefix
          const fullPath = path.join(this.basePrefix, route.path).replace(/\\/g, '/');

          // Register route
          this.app.use(fullPath, route.router);

          logger.info(`Loaded route: ${fullPath}`, {
            file,
            methods: this.getRouteMethods(route.router),
          });
        } catch (routeError) {
          logger.error(`Error loading route file: ${file}`, {
            error: routeError.message,
            stack: routeError.stack,
          });
        }
      });
    } catch (error) {
      logger.error('Failed to load routes', {
        error: error.message,
        stack: error.stack,
        routesPath: this.routesPath,
      });
    }
  }

  // Dynamically load route module
  loadRouteModule(filePath) {
    // Clear module cache to allow hot reloading in development
    if (process.env.NODE_ENV === 'development') {
      delete require.cache[require.resolve(filePath)];
    }

    return require(filePath);
  }

  // Validate route module structure
  isValidRoute(route) {
    return (
      route &&
      typeof route.path === 'string' &&
      route.router &&
      typeof route.router.stack !== 'undefined'
    );
  }

  // Extract route methods
  getRouteMethods(router) {
    try {
      return router.stack
        .map((layer) => layer.route && Object.keys(layer.route.methods))
        .filter(Boolean)
        .flat();
    } catch {
      return [];
    }
  }

  // Optional: Add route validation middleware
  addRouteValidation(router) {
    router.use((req, res, next) => {
      // Add global route validation logic if needed
      next();
    });
  }

  // Diagnostic method to list all registered routes
  listRegisteredRoutes() {
    const routes = [];

    this.app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods),
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: handler.route.path,
              methods: Object.keys(handler.route.methods),
            });
          }
        });
      }
    });

    return routes;
  }

  // Optional: Swagger/OpenAPI route documentation
  generateRouteDocumentation() {
    const routes = this.listRegisteredRoutes();

    // You can extend this to generate OpenAPI/Swagger documentation
    return routes.map((route) => ({
      ...route,
      documented: false, // Placeholder for future implementation
    }));
  }
}

module.exports = RouteLoader;
