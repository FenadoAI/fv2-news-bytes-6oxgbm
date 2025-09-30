"""
API tests for news endpoints.
Run with: python -m pytest tests/test_news_api.py -v

IMPORTANT: Requires backend server running on port 8001
Start server first: uvicorn server:app --reload --port 8001
"""

import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

API_BASE = os.getenv("API_URL", "http://localhost:8001")


def test_scrape_news_real():
    """Test scraping real news articles from URLs."""
    # Use well-known news sites with consistent structure
    test_urls = [
        "https://techcrunch.com/2025/01/01/some-tech-article/",  # Tech article
        "https://www.bbc.com/news",  # General news
    ]

    response = requests.post(
        f"{API_BASE}/api/news/scrape",
        json={"urls": test_urls},
        timeout=60,
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()

    assert data["success"] is True, "Expected success=True"
    # Note: Some URLs might fail due to paywall or structure changes
    # We just check that the endpoint works, not that all URLs succeed
    assert "scraped_count" in data, "Missing scraped_count"
    assert "failed_count" in data, "Missing failed_count"
    assert isinstance(data["articles"], list), "articles should be a list"


def test_get_news():
    """Test getting all news articles."""
    response = requests.get(f"{API_BASE}/api/news", timeout=10)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()

    assert isinstance(data, list), "Response should be a list"
    # Articles may or may not exist, so we just check structure
    if len(data) > 0:
        article = data[0]
        assert "id" in article, "Article should have id"
        assert "title" in article, "Article should have title"
        assert "summary" in article, "Article should have summary"
        assert "category" in article, "Article should have category"
        assert "source_url" in article, "Article should have source_url"


def test_get_news_by_category():
    """Test filtering news by category."""
    categories = ["Technology", "Business", "Sports"]

    for category in categories:
        response = requests.get(
            f"{API_BASE}/api/news",
            params={"category": category},
            timeout=10,
        )

        assert response.status_code == 200, f"Expected 200 for {category}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"

        # If articles exist, verify they match the category
        for article in data:
            assert (
                article["category"] == category
            ), f"Expected {category}, got {article['category']}"


def test_get_categories():
    """Test getting list of categories."""
    response = requests.get(f"{API_BASE}/api/news/categories/list", timeout=10)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()

    assert "categories" in data, "Missing categories key"
    assert isinstance(data["categories"], list), "categories should be a list"
    assert len(data["categories"]) > 0, "Should have at least one category"
    assert "Technology" in data["categories"], "Should have Technology category"
    assert "Business" in data["categories"], "Should have Business category"
    assert "Sports" in data["categories"], "Should have Sports category"


if __name__ == "__main__":
    print("Running news API tests...")
    print(f"API Base: {API_BASE}")
    print()

    try:
        print("Test 1: Get categories")
        test_get_categories()
        print("✓ PASS\n")

        print("Test 2: Get all news")
        test_get_news()
        print("✓ PASS\n")

        print("Test 3: Get news by category")
        test_get_news_by_category()
        print("✓ PASS\n")

        print("Test 4: Scrape news (takes longer)")
        test_scrape_news_real()
        print("✓ PASS\n")

        print("=" * 50)
        print("All tests passed!")
        print("=" * 50)

    except AssertionError as e:
        print(f"✗ FAIL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ ERROR: {e}")
        sys.exit(1)
