// seoSecurityHeaders.js
module.exports = (req, res, next) => {
    // Cache-Control: Cache static resources for 24 hours
    res.set('Cache-Control', 'public, max-age=86400');

    // Vary: Handle different encoding (e.g., Gzip, Brotli) and content types (e.g., WebP, webp)
    res.set('Vary', 'Accept-Encoding');

    // res.set('Content-Security-Policy', `
    //     default-src 'self'; 
    //     script-src 'self' https://cdnjs.cloudflare.com; // externe scripts zoals cdnjs
    //     style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; // inline-stijlen en externe stijlen zoals Google Fonts
    //     style-src-elem 'self' https://fonts.googleapis.com; // stijlbladen (link-elementen) van Google Fonts
    //     font-src 'self' https://fonts.gstatic.com data:; // lettertypen van Google Fonts en inline base64 lettertypen
    //     img-src 'self' data:; // afbeeldingen van eigen domein en base64 afbeeldingen
    //     frame-ancestors 'self'; // voorkom clickjacking
    //     upgrade-insecure-requests; // forceer HTTPS
    // `.replace(/\s{2,}/g, ' ').trim());
    

    
    
    
    

    // X-Content-Type-Options: Prevent MIME sniffing
    res.set('X-Content-Type-Options', 'nosniff');

    // Strict-Transport-Security (HSTS): Force HTTPS for 1 year, including subdomains
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Referrer-Policy: Control referrer information (keep referrer on same-origin and HTTPS to HTTP downgrades)
    res.set('Referrer-Policy', 'no-referrer-when-downgrade');

    next(); // Pass the request to the next middleware or route handler
};
