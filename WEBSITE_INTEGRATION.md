# Website Integration Guide

This guide shows you how to add the Supabase token bridge to your GitHub Pages website so the extension can authenticate users.

## Quick Setup

Add this script to your GitHub Pages website (in your main HTML file, before the closing `</body>` tag):

```html
<script>
  // Exply Extension - Supabase Token Bridge
  // This allows the Chrome extension to get the user's Supabase session token
  (function() {
    // Make sure you have Supabase initialized on your page
    // Example: const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    window.addEventListener('message', async (event) => {
      // Security: Only accept messages from same window
      if (event.source !== window) return;
      
      const data = event.data || {};
      
      // Extension is requesting the Supabase token
      if (data.source === 'exply-extension' && data.type === 'GET_SUPABASE_TOKEN') {
        try {
          // Get current Supabase session
          // Replace 'supabase' with your actual Supabase client variable name
          const { data: { session }, error } = await supabase.auth.getSession();
          
          const token = session?.access_token || null;
          
          // Send token back to extension
          window.postMessage(
            {
              source: 'exply-web',
              type: 'SUPABASE_TOKEN',
              token: token
            },
            '*'
          );
        } catch (err) {
          console.error('Error getting Supabase token:', err);
          // Send null token if error
          window.postMessage(
            {
              source: 'exply-web',
              type: 'SUPABASE_TOKEN',
              token: null
            },
            '*'
          );
        }
      }
    });
  })();
</script>
```

## Important Notes

1. **Supabase Client Must Be Initialized**: Make sure your Supabase client is initialized before this script runs. Replace `supabase` in the script with your actual Supabase client variable name if it's different.

2. **User Must Be Logged In**: Users need to be logged in on your website for the extension to work. If they're not logged in, the extension will show an error message.

3. **Same Browser**: The extension and website must be in the same browser profile for the token to be accessible.

## Example: Full HTML Integration

If you're using a framework or have a specific setup, here's a complete example:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your Website</title>
  <!-- Your other head content -->
</head>
<body>
  <!-- Your website content -->
  
  <!-- Supabase SDK -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Your Supabase initialization -->
  <script>
    const SUPABASE_URL = 'https://your-project.supabase.co';
    const SUPABASE_ANON_KEY = 'your-anon-key';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  </script>
  
  <!-- Exply Extension Token Bridge -->
  <script>
    window.addEventListener('message', async (event) => {
      if (event.source !== window) return;
      const data = event.data || {};
      if (data.source === 'exply-extension' && data.type === 'GET_SUPABASE_TOKEN') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || null;
          window.postMessage(
            { source: 'exply-web', type: 'SUPABASE_TOKEN', token },
            '*'
          );
        } catch (err) {
          console.error('Error getting Supabase token:', err);
          window.postMessage(
            { source: 'exply-web', type: 'SUPABASE_TOKEN', token: null },
            '*'
          );
        }
      }
    });
  </script>
</body>
</html>
```

## Testing

1. Deploy the script to your GitHub Pages site
2. Log in to your website
3. Install/load the extension
4. Try highlighting text and clicking "Exply's Explanation"
5. It should work without authentication errors!

## Troubleshooting

- **"Please log in to your account" error**: Make sure you're logged in on your website
- **No token received**: Check browser console for errors, verify Supabase client is initialized
- **Extension not working**: Make sure the script is loaded on the page (check Network tab in DevTools)

