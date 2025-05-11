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
    guid: "ai-future-cybersecurity",
    title: "Artificial Intelligence and Cybersecurity: The Future is Now",
    imageUrl: "https://cdn-ilbnkjl.nitrocdn.com/NxIxNclgHTTgNCkHcTHsiuRemZEqSxbC/assets/images/optimized/rev-a42e060/eccweb.s3.ap-south-1.amazonaws.com/wp-content/uploads/2023/03/26103842/Artificial-Intelligence-and-Cybersecurity-1.png",
    sourceName: "EC-Council University",
    pubDateStr: "2025-05-15T09:00:00Z",
    author: "EC-Council University",
    dashboardSummary: "AI is helping cybersecurity teams spot threats fast and fix security holes before hackers can use them.",
    mainContentHtml: `
        <p>Artificial intelligence (AI) is changing how we protect computer systems by using smart software to find and stop dangers.</p>
        <p>AI already powers antivirus tools, watches for hackers with machine learning, and finds hidden threats quickly.</p>
        <h4>Current Uses of AI in Cybersecurity</h4>
        <ul>
            <li>Threat Detection: AI scans data to spot attacks before they happen.</li>
            <li>Vulnerability Management: It checks code to find and fix security holes.</li>
            <li>Malware Analysis: AI studies bad software behavior to help teams respond fast.</li>
            <li>User Authentication: It looks at typing and behavior to confirm identities.</li>
            <li>Password Management: AI finds weak passwords and warns users to update them.</li>
        </ul>
        <h4>Challenges and Concerns</h4>
        <ul>
            <li>AI systems can be attacked and used to do harm if they’re not secure.</li>
            <li>It can be hard to know why AI makes certain choices (lack of transparency).</li>
            <li>AI can be biased if it learns from unfair or incomplete data.</li>
        </ul>
        <p>Looking ahead, AI may work with blockchain and connected devices (IoT) for stronger security. When used responsibly, AI helps protect data and networks better than ever.</p>
    `
},
    {
    guid: "ai-vs-ai-driven-attacks",
    title: "AI vs AI: In the age of AI-driven attacks, only AI can keep up",
    imageUrl: "https://unsplash.com/photos/gVQLAbGVB6Q", // Igor Omilaev via Unsplash
    sourceName: "Security Magazine",
    pubDateStr: "2024-12-23T00:00:00Z",
    author: "Jeff Reed",
    dashboardSummary: "Attackers now use AI to scale highly convincing attacks, so defenders must match them with AI-driven defenses guided by human expertise.",
    mainContentHtml: `
        <p>Cybersecurity constantly evolves because attackers are using AI to innovate their methods.</p>
        <p>Legacy security tools often struggle to keep up with the speed and scale of AI-driven threats.</p>
        <p>Last year, GenAI was mostly for consumers, but now big companies like Microsoft, Google, and Meta have integrated it into enterprise software.</p>
        <p>Attackers use AI to craft flawless phishing emails, mimic user behavior, and bypass multi-factor authentication.</p>
        <p>As attackers automate their campaigns, security teams must also automate defenses using AI to detect unusual patterns across cloud, network, and endpoints.</p>
        <p>AI-driven defense tools can triage alerts, correlate signals, and prioritize real threats for SOC analysts.</p>
        <p>With AI assistance, defenders can investigate, isolate, and contain attacks at machine speed.</p>
        <p>However, AI systems need expert human oversight to manage biases and ensure models use the right techniques.</p>
        <p>Choosing the correct AI method for each security task is crucial for efficient threat detection and response.</p>
        <p>By combining human expertise with AI power, organizations can protect themselves in the age of AI versus AI.</p>
        <h4>Key Takeaways</h4>
        <ul>
            <li>AI enables attackers to scale highly convincing attacks like phishing.</li>
            <li>Defenders need AI to match the speed and complexity of AI-driven threats.</li>
            <li>AI tools help SOC teams triage, correlate, and prioritize real threats.</li>
            <li>Human oversight is essential to guide AI and prevent bias.</li>
            <li>Select the right AI technique for each security task.</li>
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
