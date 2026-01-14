// Supabase authentication middleware
const supabase = require('../supabase');

async function authenticateSupabaseUser(req, res, next) {
  // If Supabase is not configured, reject all requests
  if (!supabase) {
    console.error('[auth] Supabase client not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)');
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

    console.log('[auth] Incoming Authorization header length:', authHeader ? authHeader.length : 0);

    // Token is mandatory
    if (!token) {
      console.warn('[auth] Missing Authorization token');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in to your account and try again.'
      });
    }

    // Verify token with Supabase
    console.log('[auth] Verifying Supabase token (length):', token.length);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.warn('[auth] Supabase token verification failed:', error?.message || 'no user in token');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session. Please log in again.'
      });
    }

    // Valid token - set user for usage tracking
    console.log('[auth] Authenticated user id:', data.user.id);
    req.user = { id: data.user.id };
    return next();
  } catch (err) {
    console.error('[auth] Error verifying Supabase token:', err.message, err.stack);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service error. Please try again later.'
    });
  }
}

module.exports = {
  authenticateSupabaseUser
};


