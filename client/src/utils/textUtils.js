/**
 * Specialist Utility to sanitize text from HTML tags AND entities (like &nbsp;)
 * @param {string} html 
 * @returns {string}
 */
export const stripHtml = (html) => {
    if (!html) return '';
    
    // 1. Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    
    // 2. Decode common HTML entities efficiently
    const entities = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&copy;': '©',
        '&reg;': '®'
    };
    
    // Replace all entities
    Object.keys(entities).forEach(entity => {
        text = text.split(entity).join(entities[entity]);
    });
    
    // 3. Clean up whitespace
    return text.replace(/\s+/g, ' ').trim();
};
