// ==============================================
// NoSQL Injection & Prototype Pollution Protection
// Blocks MongoDB operator injection ($gt, $ne, $where, etc.)
// and dangerous prototype-pollution keys in all request input.
// ==============================================

// Keys that can be used for MongoDB operator injection
const MONGODB_OPERATOR_REGEX = /^\$/;

// Prototype pollution / dangerous keys
const DANGEROUS_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);

// Recursively check for dangerous keys/operators.
// Returns true if the value contains an injection vector.
const containsInjection = (value) => {
  if (value === null || value === undefined) return false;

  if (typeof value === 'object') {
    // Guard against null prototype objects / arrays
    if (Array.isArray(value)) {
      return value.some(containsInjection);
    }
    // Ensure value is a plain object before iterating keys
    if (typeof value !== 'object') return false;
    try {
      return Object.keys(value).some((key) => {
        if (MONGODB_OPERATOR_REGEX.test(key) || DANGEROUS_KEYS.has(key)) {
          return true;
        }
        return containsInjection(value[key]);
      });
    } catch (e) {
      return true;
    }
  }

  return false;
};

// Cleanse a value by removing dangerous keys recursively
const cleanse = (value) => {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(cleanse);
  }

  if (typeof value === 'object') {
    const safe = {};
    try {
      for (const key of Object.keys(value)) {
        if (MONGODB_OPERATOR_REGEX.test(key) || DANGEROUS_KEYS.has(key)) {
          continue; // drop dangerous keys
        }
        safe[key] = cleanse(value[key]);
      }
    } catch (e) {
      return value;
    }
    return safe;
  }

  return value;
};

// Middleware: reject requests containing injection vectors in query/body/params
const noSqlInjection = (req, res, next) => {
  const sources = ['query', 'body', 'params'];

  for (const source of sources) {
    const data = req[source];
    if (data && typeof data === 'object' && containsInjection(data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: restricted characters or structure detected.',
      });
    }
    // Cleanse anyway as defense in depth (strips any dangerous keys that slip through)
    if (data && typeof data === 'object') {
      req[source] = cleanse(data);
    }
  }

  next();
};

module.exports = noSqlInjection;