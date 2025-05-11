# File: api/get_rss_feeds.py
# This script is designed to be deployed as a serverless function
# (e.g., on Vercel, Netlify, AWS Lambda, Google Cloud Functions).

from flask import Flask, request, jsonify
from flask_cors import CORS # For handling Cross-Origin Resource Sharing
import feedparser # Robust RSS/Atom feed parsing library
import re # Regular expressions for cleaning HTML content
from datetime import datetime, timezone # For handling dates
from urllib.parse import urlparse # For getting domain name as fallback source

# Initialize Flask app
# When deploying to Vercel, Vercel typically looks for an 'app' instance.
app = Flask(__name__)

# Configure CORS:
# For development, allowing all origins is fine.
# For production, you should restrict this to your actual frontend domain(s).
# Example: CORS(app, origins=["https://yourdomain.com", "http://localhost:3000"])
CORS(app)

# --- Helper Functions ---

def get_full_description_html(entry):
    """
    Tries to get the most complete HTML version of the description/content.
    Feedparser often puts full content in `content` (if available and HTML)
    or `summary` (which might be HTML or plain text).
    It also handles cases where `content` is a list.
    """
    if hasattr(entry, 'content') and entry.content:
        for content_item in entry.content:
            # Check for HTML content type
            if hasattr(content_item, 'type') and ('html' in content_item.type.lower()):
                return content_item.value
        # If no HTML type found in content array, return the first content's value
        # It might be plain text, or HTML without a type specified.
        if entry.content[0] and hasattr(entry.content[0], 'value'):
             return entry.content[0].value

    # Fallback to summary if content is not suitable or not present
    if hasattr(entry, 'summary'):
        return entry.summary
        
    # Further fallback for feeds that might use 'description' for full content
    # (feedparser itself might alias content:encoded to 'description' or 'summary'
    # depending on context, but checking explicitly can be useful)
    if hasattr(entry, 'description'):
        return entry.description
        
    return "" # Return empty string if no suitable content is found

def get_image_url(entry, feed_url_for_base=None):
    """
    Tries to extract a representative image URL from a feed entry.
    Checks common places: media:content, media:thumbnail, enclosures,
    and attempts to find an <img> tag in the description HTML.
    """
    image_url = None

    # 1. Check media:content (often used for high-quality images)
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            if media.get('medium') == 'image' and media.get('url'):
                image_url = media.get('url')
                break
    if image_url: return image_url

    # 2. Check media:thumbnail
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        if isinstance(entry.media_thumbnail, list) and len(entry.media_thumbnail) > 0:
            image_url = entry.media_thumbnail[0].get('url')
        elif isinstance(entry.media_thumbnail, dict): # some feeds structure it as a dict
             image_url = entry.media_thumbnail.get('url')
    if image_url: return image_url
    
    # 3. Check enclosures (common in RSS 2.0 for attachments)
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enclosure in entry.enclosures:
            if enclosure.get('type', '').startswith('image') and enclosure.get('href'):
                image_url = enclosure.href
                break
    if image_url: return image_url

    # 4. Fallback: Try finding an <img> tag within the description HTML
    # This is less reliable as it might pick up small icons or unrelated images.
    description_html = get_full_description_html(entry)
    if description_html:
        # A more robust regex to capture src, and handle single/double quotes
        img_match = re.search(r'<img[^>]+src=(["\'])(.+?)\1', description_html, re.IGNORECASE)
        if img_match:
            potential_url = img_match.group(2)
            # Resolve relative URLs if possible
            if potential_url.startswith('//'):
                image_url = 'http:' + potential_url # Default to http, can be https
            elif potential_url.startswith('/'):
                if feed_url_for_base: # If we have the base feed URL
                    parsed_base_feed_url = urlparse(feed_url_for_base)
                    if parsed_base_feed_url.scheme and parsed_base_feed_url.netloc:
                        image_url = f"{parsed_base_feed_url.scheme}://{parsed_base_feed_url.netloc}{potential_url}"
            elif potential_url.startswith('http'):
                image_url = potential_url
            # else: it might be a relative path like "image.jpg" which is hard to resolve without more context.
    
    return image_url

# Main API route for fetching and processing RSS feeds
# Vercel will typically make this available at /api/get_rss_feeds if the file is api/get_rss_feeds.py
@app.route('/api/get_rss_feeds', methods=['GET'])
def get_rss_feeds_handler():
    """
    Handles GET requests to fetch and process RSS feeds.
    Expects a 'urls' query parameter with comma-separated RSS feed URLs.
    """
    feed_urls_str = request.args.get('urls')
    if not feed_urls_str:
        return jsonify({"error": "Query parameter 'urls' is required (comma-separated RSS feed URLs)."}), 400

    feed_urls = [url.strip() for url in feed_urls_str.split(',') if url.strip()]
    if not feed_urls:
        return jsonify({"error": "No valid RSS feed URLs provided in 'urls' parameter."}), 400

    all_items = []
    # Using a set for GUIDs helps in de-duplicating articles if they appear in multiple feeds
    # or if a single feed has duplicate entries (though feedparser often handles this).
    processed_guids = set()

    for feed_url in feed_urls:
        app.logger.info(f"Processing feed: {feed_url}") # Use app.logger for serverless environments
        try:
            # feedparser handles fetching the URL
            parsed_feed = feedparser.parse(feed_url)

            # Extract feed-level information (source name)
            source_name = parsed_feed.feed.get('title', '').strip()
            if not source_name: # Fallback to domain name if title is missing
                try:
                    parsed_url = urlparse(feed_url)
                    source_name = parsed_url.netloc if parsed_url.netloc else "Unknown Source"
                except Exception:
                    source_name = "Unknown Source"

            # Process each entry (article) in the feed
            for entry in parsed_feed.entries:
                title = entry.get('title', 'No Title Available').strip()
                link = entry.get('link', '')

                # Determine GUID: entry.id is often a permalink. Fallback to link.
                # If both are missing, a unique ID is constructed.
                guid = entry.get('id', link)
                if not guid:
                    guid = f"{source_name}_{title}_{link}" # Construct a fallback GUID

                if guid in processed_guids:
                    app.logger.info(f"Skipping duplicate GUID: {guid} from {feed_url}")
                    continue # Skip if this item (by GUID) has already been processed
                processed_guids.add(guid)

                # Published Date: feedparser provides 'published_parsed' or 'updated_parsed'
                # These are time.struct_time objects. Convert to ISO 8601 string format.
                pub_date_struct = entry.get('published_parsed') or entry.get('updated_parsed')
                if pub_date_struct:
                    # Ensure it's timezone-aware (UTC if no timezone info) before converting to ISO format
                    dt_obj = datetime(*pub_date_struct[:6])
                    # If feedparser doesn't provide timezone info, assume UTC.
                    # Most serverless environments operate in UTC.
                    pub_date_str = dt_obj.replace(tzinfo=timezone.utc).isoformat()
                else:
                    # Fallback to current UTC time if no date is found in the feed
                    pub_date_str = datetime.now(timezone.utc).isoformat()

                # Description/Content: Get the full HTML content
                description_html = get_full_description_html(entry)

                # Author: Extract author name
                author_detail = entry.get('author_detail')
                author = entry.get('author', 'Unknown Author')
                if author_detail and hasattr(author_detail, 'name') and author_detail.name:
                    author = author_detail.name
                elif hasattr(entry, 'authors') and entry.authors: # some feeds use 'authors' list
                    author = entry.authors[0].get('name', author)
                
                # Image URL
                image_url = get_image_url(entry, feed_url) # Pass feed_url to help resolve relative image paths

                all_items.append({
                    "guid": guid,
                    "title": title,
                    "link": link,
                    "pubDateStr": pub_date_str,        # ISO 8601 format
                    "descriptionHtml": description_html, # Full HTML content
                    "author": author.strip() if author else "Unknown Author",
                    "imageUrl": image_url,
                    "sourceName": source_name,
                })
        except Exception as e:
            # Log errors for specific feeds but continue processing others
            app.logger.error(f"Error processing feed {feed_url}: {str(e)}", exc_info=True)

    # Sort all collected items by publication date (most recent first)
    all_items.sort(key=lambda x: x['pubDateStr'], reverse=True)
    
    app.logger.info(f"Successfully processed and returning {len(all_items)} items.")
    return jsonify(all_items)

# This part is for local development testing (e.g., running `python api/get_rss_feeds.py`)
# Vercel (or other serverless platforms) will use a WSGI server like Gunicorn
# to run the 'app' object and will not execute this __main__ block.
if __name__ == '__main__':
    # Setup basic logging for local development
    import logging
    logging.basicConfig(level=logging.INFO)
    # Run the Flask development server
    # Host '0.0.0.0' makes it accessible on your local network
    app.run(host='0.0.0.0', port=5001, debug=True)
