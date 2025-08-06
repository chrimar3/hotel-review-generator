module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  extends: [
    'standard',
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  globals: {
    // Global variables for our application
    'HotelReviewApp': 'readonly',
    'ReviewGeneratorAgent': 'readonly',
    'PlatformRoutingAgent': 'readonly', 
    'UIControllerAgent': 'readonly',
    'StateManagementAgent': 'readonly',
    'SimpleLogger': 'readonly',
    // Build-time constants
    '__APP_VERSION__': 'readonly',
    '__BUILD_TIME__': 'readonly',
    '__DEV__': 'readonly'
  },
  rules: {
    // Code quality
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'warn',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Style consistency
    'indent': ['error', 4, { 
      SwitchCase: 1,
      ignoredNodes: ['ConditionalExpression']
    }],
    'quotes': ['error', 'single', { 
      avoidEscape: true,
      allowTemplateLiterals: true 
    }],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Function and class rules
    'space-before-function-paren': ['error', 'never'],
    'func-call-spacing': ['error', 'never'],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-infix-ops': 'error',
    
    // Modern JavaScript
    'arrow-spacing': 'error',
    'template-curly-spacing': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    
    // Async/await
    'no-async-promise-executor': 'error',
    'require-await': 'warn',
    
    // Error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Accessibility (for HTML in JS)
    'jsx-a11y/alt-text': 'off' // We're not using JSX
  },
  overrides: [
    {
      // Test files
      files: ['tests/**/*.test.js', '**/*.test.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      // Configuration files
      files: [
        'vite.config.js',
        '.eslintrc.js',
        'jest.config.js',
        'postcss.config.js'
      ],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      // HTML files (for inline scripts)
      files: ['*.html'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.min.js'
  ]
}