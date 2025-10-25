const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const session = require('express-session');
const compression = require('compression');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./models');
const { Admin } = require('./models');
const billScheduler = require('./services/billScheduler'); // Automatic bill generation enabled

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admins');
const propertyRoutes = require('./routes/properties');
const tenantRoutes = require('./routes/tenants');
const billRoutes = require('./routes/bills');
const analyticsRoutes = require('./routes/analytics');
const expensesRoutes = require('./routes/expenses');

// Import services
const cronService = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware for better performance
app.use(compression());

// Session management for multi-user support
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:4002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Cache-Control']
}));

// Rate limiting - Optimized for multi-user support
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 2000, // Increased for multi-user support
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 login attempts per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Serve static uploads - both old 'uploads' and new 'public/uploads' directories
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use('/uploads', express.static(require('path').join(__dirname, 'public', 'uploads')));

// Serve frontend static files (for Cloudflare tunnel)
const path = require('path');
const frontendPath = path.join(__dirname, '..', 'dist');

// Serve static files from the frontend build
app.use(express.static(frontendPath));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Property Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoints removed - data isolation is now properly implemented

// Cron job status endpoint
app.get('/api/cron/status', (req, res) => {
  try {
    const status = cronService.getJobStatuses();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cron job status',
      error: error.message
    });
  }
});

// Test endpoint for bill generation (development only)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/test/generate-bills', async (req, res) => {
    try {
      const { month } = req.body;
      const result = await cronService.triggerMonthlyBillGeneration(month);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate bills',
        error: error.message
      });
    }
  });

  // Show example bill (development only)
  app.get('/api/test/example-bill', async (req, res) => {
    try {
      const { Bill, Tenant, Property, Admin } = require('./models');
      const bill = await Bill.findOne({
        where: { language: 'fr' },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'title', 'address', 'city', 'monthly_rent']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      if (!bill) {
        return res.json({
          success: false,
          message: 'No French bills found. Generate one first using /api/test/generate-bills'
        });
      }

      // Generate French bill content
      const FrenchBillTemplate = require('./services/frenchBillTemplate');
      const frenchContent = FrenchBillTemplate.generateBillContent(bill);

      res.json({
        success: true,
        message: 'Example French Bill Generated',
        data: {
          bill: {
            id: bill.id,
            amount: bill.amount,
            month: bill.month,
            bill_date: bill.bill_date,
            due_date: bill.due_date,
            status: bill.status,
            language: bill.language,
            description: bill.description
          },
          frenchContent: frenchContent,
          tenant: bill.tenant,
          property: bill.property,
          admin: bill.admin
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get example bill',
        error: error.message
      });
    }
  });

  // Test PDF generation (development only)
  app.get('/api/test/download-pdf/:billId', async (req, res) => {
    try {
      const { billId } = req.params;
      const { Bill, Tenant, Property, Admin } = require('./models');
      const PDFService = require('./services/pdfService');
      
      const bill = await Bill.findOne({
        where: { id: billId },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'title', 'address', 'city', 'monthly_rent']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Bill not found'
        });
      }

      // Stream PDF directly with correct headers and length
      // Prefer persisted file path for exact bytes; fallback to streaming
      if (bill.pdf_path) {
        const fsLocal = require('fs');
        try {
          const stat = fsLocal.statSync(bill.pdf_path);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="facture-${bill.id}-${bill.month}.pdf"`);
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Length', stat.size);
          fsLocal.createReadStream(bill.pdf_path).pipe(res);
        } catch {
          PDFService.streamBillPDF(res, bill);
        }
      } else {
        PDFService.streamBillPDF(res, bill);
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  });
}

// Debug endpoints removed - admin already created

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/expenses', expensesRoutes);

// Serve the frontend for any non-API routes
app.get('*', (req, res) => {
  // Don't serve frontend for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API route not found'
    });
  }
  
  // Serve the frontend index.html for all other routes
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global error handler with improved multi-user support
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  console.error(`[${timestamp}] [${requestId}] Global error handler:`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  // Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry',
      details: error.errors.map(err => ({
        field: err.path,
        message: `${err.path} already exists`
      }))
    });
  }
  
  // Sequelize foreign key constraint errors
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference',
      message: 'Referenced record does not exist'
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }
  
  // Add connection error handling
  if (error.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      error: 'Database connection error',
      details: 'Service temporarily unavailable',
      requestId
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    requestId
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database (create tables if they don't exist)
    await syncDatabase();
    
    // Start bill scheduler for automatic monthly bill generation
    billScheduler.start();
    console.log('✅ Bill scheduler started - Bills will be generated automatically on the 1st of each month');

    // Bootstrap a default SUPER_ADMIN if none exists
    try {
      const adminCount = await Admin.count();
      if (adminCount === 0) {
        const defaultEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const defaultName = process.env.ADMIN_NAME || 'Default Admin';

        await Admin.create({
          name: defaultName,
          email: defaultEmail,
          password: defaultPassword,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE'
        });

        console.log('👤 Created default SUPER_ADMIN account');
        console.log(`   Email: ${defaultEmail}`);
        console.log('   Password: (from ADMIN_PASSWORD env or default)');
      }
    } catch (bootstrapErr) {
      console.error('Failed to bootstrap default admin:', bootstrapErr);
    }
    
    // Start listening
    // Initialize cron service for automated tasks
    cronService.initialize();

    // Lock to the specified PORT; fail fast if in use
    const server = app.listen(Number(PORT), () => {
      console.log('========================================');
      console.log('🚀 Property Management API Server');
      console.log('========================================');
      console.log(`📍 Status: Running`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}`);
      console.log(`💾 Database Pool: Max ${process.env.NODE_ENV === 'production' ? '50' : '20'} connections`);
      console.log(`⚡ Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || '2000'} requests per 15 minutes`);
      console.log('🔧 Multi-user support: ENABLED');
      console.log('🕐 Cron Jobs: Initialized');
      console.log('========================================');
    });
    
    // Configure server timeouts for better multi-user support
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000;   // 66 seconds

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please free it and restart.`);
      } else {
        console.error('❌ Failed to bind server:', err);
      }
      process.exit(1);
    });
    
    // Graceful shutdown handling for multi-user support
    const gracefulShutdown = (signal) => {
      console.log(`🛑 ${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
