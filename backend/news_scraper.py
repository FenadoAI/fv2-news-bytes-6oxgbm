"""News scraper and AI summarization module."""

import logging
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from langchain_core.messages import HumanMessage

from ai_agents.agents import AgentConfig, ChatAgent

logger = logging.getLogger(__name__)


class NewsArticle:
    """Represents a scraped news article."""

    def __init__(
        self,
        title: str,
        content: str,
        source_url: str,
        source_name: str,
        image_url: Optional[str] = None,
        published_at: Optional[datetime] = None,
    ):
        self.title = title
        self.content = content
        self.source_url = source_url
        self.source_name = source_name
        self.image_url = image_url
        self.published_at = published_at or datetime.now(timezone.utc)


class NewsScraper:
    """Scrapes news articles from websites."""

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
        }

    def scrape_article(self, url: str, max_retries: int = 3) -> Optional[NewsArticle]:
        """
        Scrape a single article from a URL with retry logic.

        Args:
            url: The URL of the article to scrape
            max_retries: Maximum number of retry attempts

        Returns:
            NewsArticle object or None if scraping failed
        """
        for attempt in range(max_retries):
            try:
                # Add delay between retries
                if attempt > 0:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    logger.info(f"Retry attempt {attempt + 1} for {url}")

                response = requests.get(url, headers=self.headers, timeout=15, allow_redirects=True)

                # Check for common blocking status codes
                if response.status_code in [401, 403]:
                    logger.warning(f"Access denied (status {response.status_code}) for {url}. This website may be blocking automated access.")
                    if attempt == max_retries - 1:
                        return None
                    continue

                response.raise_for_status()

                soup = BeautifulSoup(response.content, "html.parser")

                # Extract title
                title = self._extract_title(soup)
                if not title:
                    logger.warning(f"Could not extract title from {url}")
                    if attempt == max_retries - 1:
                        return None
                    continue

                # Extract content
                content = self._extract_content(soup)
                if not content:
                    logger.warning(f"Could not extract content from {url}")
                    if attempt == max_retries - 1:
                        return None
                    continue

                # Extract image
                image_url = self._extract_image(soup, url)

                # Get source name from domain
                source_name = self._get_source_name(url)

                logger.info(f"Successfully scraped: {title[:50]}...")
                return NewsArticle(
                    title=title,
                    content=content,
                    source_url=url,
                    source_name=source_name,
                    image_url=image_url,
                )

            except requests.HTTPError as e:
                if e.response.status_code in [401, 403, 429]:
                    logger.warning(f"HTTP {e.response.status_code} for {url}. Website may be blocking scraper.")
                else:
                    logger.error(f"HTTP error scraping {url}: {e}")
                if attempt == max_retries - 1:
                    return None
            except requests.RequestException as e:
                logger.error(f"Request error scraping {url}: {e}")
                if attempt == max_retries - 1:
                    return None
            except Exception as e:
                logger.error(f"Unexpected error scraping {url}: {e}")
                if attempt == max_retries - 1:
                    return None

        return None

    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract article title from HTML."""
        # Try multiple common title tags
        for selector in ["h1", "h1.article-title", "h1.entry-title", "[property='og:title']"]:
            title_tag = soup.select_one(selector)
            if title_tag:
                if title_tag.has_attr("content"):
                    return title_tag["content"].strip()
                return title_tag.get_text().strip()

        # Fallback to page title
        title_tag = soup.find("title")
        if title_tag:
            return title_tag.get_text().strip()

        return None

    def _extract_content(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract article content from HTML."""
        # Try multiple common article content selectors
        for selector in ["article", ".article-content", ".post-content", ".entry-content", "main"]:
            content_tag = soup.select_one(selector)
            if content_tag:
                # Get all paragraph texts
                paragraphs = content_tag.find_all("p")
                if paragraphs:
                    content = " ".join([p.get_text().strip() for p in paragraphs])
                    if len(content) > 100:  # Minimum content length
                        return content

        # Fallback: get all paragraphs
        paragraphs = soup.find_all("p")
        if paragraphs:
            content = " ".join([p.get_text().strip() for p in paragraphs])
            if len(content) > 100:
                return content

        return None

    def _extract_image(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """Extract article image URL from HTML."""
        # Try Open Graph image
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            return og_image["content"]

        # Try Twitter card image
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        if twitter_image and twitter_image.get("content"):
            return twitter_image["content"]

        # Try first img tag in article
        article = soup.find("article")
        if article:
            img = article.find("img")
            if img and img.get("src"):
                return self._make_absolute_url(img["src"], base_url)

        return None

    def _make_absolute_url(self, url: str, base_url: str) -> str:
        """Convert relative URL to absolute URL."""
        if url.startswith("http"):
            return url
        parsed_base = urlparse(base_url)
        return f"{parsed_base.scheme}://{parsed_base.netloc}{url}"

    def _get_source_name(self, url: str) -> str:
        """Extract source name from URL domain."""
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "")
        # Capitalize first letter
        return domain.split(".")[0].capitalize()


class NewsAISummarizer:
    """AI-powered news summarizer and categorizer."""

    CATEGORIES = ["Technology", "Business", "Sports"]

    def __init__(self, config: AgentConfig):
        self.config = config
        self.agent = ChatAgent(config)

    async def summarize_and_categorize(
        self, article: NewsArticle
    ) -> Dict[str, str]:
        """
        Summarize article to exactly 60 words and categorize it.

        Args:
            article: NewsArticle object to summarize

        Returns:
            Dict with 'summary' and 'category' keys
        """
        prompt = f"""You are a news summarizer. Read the following news article and:
1. Summarize it in EXACTLY 60 words (no more, no less)
2. Categorize it as one of: Technology, Business, Sports

Article Title: {article.title}
Article Content: {article.content[:2000]}

Respond in this exact format:
SUMMARY: [your 60-word summary here]
CATEGORY: [Technology/Business/Sports]"""

        try:
            result = await self.agent.execute(prompt)

            if not result.success:
                logger.error(f"AI summarization failed: {result.error}")
                return {
                    "summary": self._fallback_summary(article.content),
                    "category": "Business",
                }

            # Parse response
            response = result.content
            summary = self._extract_field(response, "SUMMARY:")
            category = self._extract_field(response, "CATEGORY:")

            # Validate category
            if category not in self.CATEGORIES:
                category = "Business"

            # Ensure summary is around 60 words
            if not summary:
                summary = self._fallback_summary(article.content)

            return {"summary": summary.strip(), "category": category.strip()}

        except Exception as e:
            logger.error(f"Error in AI summarization: {e}")
            return {
                "summary": self._fallback_summary(article.content),
                "category": "Business",
            }

    def _extract_field(self, text: str, field_name: str) -> str:
        """Extract field value from AI response."""
        lines = text.split("\n")
        for line in lines:
            if field_name in line:
                return line.replace(field_name, "").strip()
        return ""

    def _fallback_summary(self, content: str) -> str:
        """Create a fallback summary by truncating content."""
        words = content.split()[:60]
        return " ".join(words) + ("..." if len(content.split()) > 60 else "")
