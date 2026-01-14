// Supabase authentication middleware
const supabase = require('../supabase');

async function authenticateSupabaseUser(req, res, next) {
  // If Supabase is not configured, skip auth (backend remains open)
  if (!supabase) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing authentication token. Please log in on exply.app and try again.'
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session. Please log in again on exply.app.'
      });
    }

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


