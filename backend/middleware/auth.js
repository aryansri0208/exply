// Supabase authentication middleware
const supabase = require('../supabase');

async function authenticateSupabaseUser(req, res, next) {
  // If Supabase is not configured, reject all requests
  if (!supabase) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Authentication service is not configured. Please contact support.'
    });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    // Token is mandatory
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in on exply.app and try again.'
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session. Please log in again on exply.app.'
      });
    }

    // Valid token - set user for usage tracking
    req.user = { id: data.user.id };
    return next();
  } catch (err) {
    console.error('[auth] Error verifying Supabase token:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service error. Please try again later.'
    });
  }
}

module.exports = {
  authenticateSupabaseUser
};


