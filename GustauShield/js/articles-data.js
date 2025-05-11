// File: js/articles-data.js
// This file contains your 10 predefined static articles.
// YOU NEED TO REPLACE THE CONTENT OF EACH ARTICLE OBJECT.

// --- INSTRUCTIONS ---
// For each of the 10 articles below:
// 1. guid: Keep it unique (e.g., "my-first-topic", "another-cool-subject").
// 2. title: Write the actual title of your article.
// 3. imageUrl:
//    - For now, you can use placeholder URLs like: 'https://placehold.co/100x75/8a2be2/ffffff?text=Topic+1'
//    - Later, replace these with paths to your actual images (e.g., 'assets/images/topic1.jpg').
//      The dashboard uses a small version (e.g., 100x75). The blog page can display a larger version.
// 4. sourceName: The source (e.g., "GustauShield Research", "Industry Insights").
// 5. pubDateStr: A publication date (e.g., "2025-05-15T10:00:00Z").
// 6. author: The author's name.
// 7. dashboardSummary: A SHORT (1-2 sentences) compelling summary for the dashboard list.
// 8. mainContentHtml: The FULL article content. Use HTML tags for formatting:
//    - <p>Paragraphs of text, written in simple language.</p>
//    - <h4>Subheadings if needed</h4>
//    - <ul><li>Bulleted lists for key points or examples.</li></ul>
//    - <strong>Important terms in bold.</strong>
//    - Provide examples as requested by the user.

const GUSTAU_SHIELD_ARTICLES = [
    {
        guid: "topic-1-guid", // REPLACE: Unique ID, e.g., "ai-in-phishing"
        title: "REPLACE: Your First Article Title",
        imageUrl: "https://placehold.co/100x75/00ffff/000000?text=Topic+1", // REPLACE
        sourceName: "REPLACE: Source (e.g., GustauShield Analysis)",
        pubDateStr: "2025-05-15T09:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: A very short, catchy summary (1-2 sentences) for the dashboard display. Make it simple and give a hint of an example.",
        mainContentHtml: `
            <p>REPLACE: Start your full article content here. Use simple words. This is the first paragraph.</p>
            <p>REPLACE: This is another paragraph. For example, if you are talking about AI in phishing, you could say: <em>"Imagine you get an email that looks like it's from your bank, asking you to update your password. An old phishing email might have bad grammar. But an AI-powered one? It could be perfect, even using information it found about you online to make it seem more real!"</em></p>
            <h4>REPLACE: A Subheading for Key Points</h4>
            <ul>
                <li>REPLACE: First key point or example, explained simply.</li>
                <li>REPLACE: Second key point or example.</li>
                <li>REPLACE: Third key point.</li>
            </ul>
            <p>REPLACE: Concluding paragraph for the article.</p>
        `
    },
    {
        guid: "topic-2-guid", // REPLACE
        title: "REPLACE: Your Second Article Title",
        imageUrl: "https://placehold.co/100x75/0077ff/ffffff?text=Topic+2", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-14T10:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 2. Explain a concept simply and give an example.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 2. Remember to use simple words and provide clear examples.</p>
            <p><strong>Example:</strong> Let's say this article is about malware. <em>"Malware is like a computer cold. It's bad software that can make your computer sick, steal your information, or even lock your files until you pay money (that's called ransomware!). An example is a virus you might get from a bad email attachment."</em></p>
            <ul>
                <li>REPLACE: Detail 1.</li>
                <li>REPLACE: Detail 2.</li>
            </ul>
        `
    },
    {
        guid: "topic-3-guid", // REPLACE
        title: "REPLACE: Your Third Article Title",
        imageUrl: "https://placehold.co/100x75/8a2be2/ffffff?text=Topic+3", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-13T11:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 3. What's the main idea? Give a simple illustration.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 3.</p>
            <p><em>For instance, if discussing Zero Trust: "Think of Zero Trust like a super strict security guard at every door inside a building, not just the front door. Even if you're an employee, you need to prove who you are and why you need to open each specific door, every single time. No free passes!"</em></p>
        `
    },
    {
        guid: "topic-4-guid", // REPLACE
        title: "REPLACE: Your Fourth Article Title",
        imageUrl: "https://placehold.co/100x75/ff6347/ffffff?text=Topic+4", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-12T12:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 4. Use an analogy or simple example.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 4.</p>
        `
    },
    {
        guid: "topic-5-guid", // REPLACE
        title: "REPLACE: Your Fifth Article Title",
        imageUrl: "https://placehold.co/100x75/32cd32/ffffff?text=Topic+5", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-11T13:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 5. Simple explanation + example.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 5.</p>
        `
    },
    {
        guid: "topic-6-guid", // REPLACE
        title: "REPLACE: Your Sixth Article Title",
        imageUrl: "https://placehold.co/100x75/ffa500/000000?text=Topic+6", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-10T14:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 6. Easy to understand + example.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 6.</p>
        `
    },
    {
        guid: "topic-7-guid", // REPLACE
        title: "REPLACE: Your Seventh Article Title",
        imageUrl: "https://placehold.co/100x75/ffc0cb/000000?text=Topic+7", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-09T15:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 7. Simple words and an example.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 7.</p>
        `
    },
    {
        guid: "topic-8-guid", // REPLACE
        title: "REPLACE: Your Eighth Article Title",
        imageUrl: "https://placehold.co/100x75/9370db/ffffff?text=Topic+8", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-08T16:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 8. Explain with a simple case.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 8.</p>
        `
    },
    {
        guid: "topic-9-guid", // REPLACE
        title: "REPLACE: Your Ninth Article Title",
        imageUrl: "https://placehold.co/100x75/7fffd4/000000?text=Topic+9", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-07T17:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 9. Make it relatable with an example.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 9.</p>
        `
    },
    {
        guid: "topic-10-guid", // REPLACE
        title: "REPLACE: Your Tenth Article Title",
        imageUrl: "https://placehold.co/100x75/6495ed/ffffff?text=Topic+10", // REPLACE
        sourceName: "REPLACE: Source",
        pubDateStr: "2025-05-06T18:00:00Z", // REPLACE
        author: "REPLACE: Author Name",
        dashboardSummary: "REPLACE: Short summary for topic 10. Simple explanation and a quick example.",
        mainContentHtml: `
            <p>REPLACE: Full content for article 10.</p>
        `
    }
];

// Automatically generate the 'link' property for each article
// This creates the correct URL for navigating to the blogs.html page for each article
GUSTAU_SHIELD_ARTICLES.forEach(article => {
    article.link = `blogs.html?article=${encodeURIComponent(article.guid)}`;
});

// This makes the GUSTAU_SHIELD_ARTICLES array available to other scripts
// (like news-feed.js) if they are loaded after this one in your HTML.
if (typeof window !== 'undefined') {
    window.GUSTAU_SHIELD_ARTICLES = GUSTAU_SHIELD_ARTICLES;
}
