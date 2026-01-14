// Usage tracking (per-user) without storing prompt or context
const supabase = require('./supabase');

/**
 * Track usage for a user.
 * Only stores metadata (user_id, mode, tokens, timestamp).
 * Does NOT store actual prompts or context.
 *
 * @param {string} userId - Supabase user ID (UUID)
 * @param {Object} params
 * @param {string} params.mode - explanation mode ('explain' | 'simplify' | 'implication')
 * @param {number} [params.tokens] - optional token count from AI provider
 */
async function trackUsage(userId, { mode, tokens }) {
  if (!supabase) {
    // Supabase not configured; skip tracking
    return;
  }

  try {
    await supabase.from('user_usage').insert({
      user_id: userId,
      mode,
      tokens: typeof tokens === 'number' ? tokens : null
    });
  } catch (err) {
    console.error('[usage] Failed to record usage (non-fatal):', err.message);
  }
}

module.exports = {
  trackUsage
};


