"""FastAPI server exposing AI agent endpoints."""

import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

from ai_agents.agents import AgentConfig, ChatAgent, SearchAgent
from news_scraper import NewsAISummarizer, NewsScraper


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

# Security
security = HTTPBearer(auto_error=False)


# Auth Models
class GoogleLoginRequest(BaseModel):
    token: str  # Can be ID token or Google user ID for testing
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    access_token: Optional[str] = None
    user: Optional[dict] = None
    error: Optional[str] = None


class UserModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    google_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class ChatRequest(BaseModel):
    message: str
    agent_type: str = "chat"
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    success: bool
    response: str
    agent_type: str
    capabilities: List[str]
    metadata: dict = Field(default_factory=dict)
    error: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    max_results: int = 5


class SearchResponse(BaseModel):
    success: bool
    query: str
    summary: str
    search_results: Optional[dict] = None
    sources_count: int
    error: Optional[str] = None


class NewsArticleModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    summary: str
    category: str
    source_url: str
    source_name: str
    image_url: Optional[str] = None
    published_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NewsScrapeRequest(BaseModel):
    urls: List[str]


class ManualNewsArticleCreate(BaseModel):
    title: str
    summary: str
    category: str
    source_url: str
    source_name: str
    image_url: Optional[str] = None
    image_base64: Optional[str] = None  # For uploaded images


def _ensure_db(request: Request):
    try:
        return request.app.state.db
    except AttributeError as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=503, detail="Database not ready") from exc


def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=30)) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    jwt_secret = os.getenv("JWT_SECRET_KEY", "your-secret-key")
    encoded_jwt = jwt.encode(to_encode, jwt_secret, algorithm="HS256")
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials) -> dict:
    """Verify JWT token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        jwt_secret = os.getenv("JWT_SECRET_KEY", "your-secret-key")
        payload = jwt.decode(credentials.credentials, jwt_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current authenticated user."""
    payload = verify_token(credentials)
    db = _ensure_db(request)
    user = await db.users.find_one({"id": payload.get("user_id")})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _get_agent_cache(request: Request) -> Dict[str, object]:
    if not hasattr(request.app.state, "agent_cache"):
        request.app.state.agent_cache = {}
    return request.app.state.agent_cache


async def _get_or_create_agent(request: Request, agent_type: str):
    cache = _get_agent_cache(request)
    if agent_type in cache:
        return cache[agent_type]

    config: AgentConfig = request.app.state.agent_config

    if agent_type == "search":
        cache[agent_type] = SearchAgent(config)
    elif agent_type == "chat":
        cache[agent_type] = ChatAgent(config)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown agent type '{agent_type}'")

    return cache[agent_type]


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv(ROOT_DIR / ".env")

    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")

    if not mongo_url or not db_name:
        missing = [name for name, value in {"MONGO_URL": mongo_url, "DB_NAME": db_name}.items() if not value]
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    client = AsyncIOMotorClient(mongo_url)

    try:
        app.state.mongo_client = client
        app.state.db = client[db_name]
        app.state.agent_config = AgentConfig()
        app.state.agent_cache = {}
        app.state.news_scraper = NewsScraper()
        app.state.news_summarizer = NewsAISummarizer(AgentConfig())
        logger.info("AI Agents API starting up")
        yield
    finally:
        client.close()
        logger.info("AI Agents API shutdown complete")


app = FastAPI(
    title="AI Agents API",
    description="Minimal AI Agents API with LangGraph and MCP support",
    lifespan=lifespan,
)

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


# Auth Endpoints
@api_router.post("/auth/google", response_model=AuthResponse)
async def google_login(login_request: GoogleLoginRequest, request: Request):
    """Authenticate user with Google OAuth token."""
    try:
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")

        # For development/testing: allow direct user info if provided
        if login_request.email and login_request.name:
            google_id = login_request.token
            email = login_request.email
            name = login_request.name
            picture = login_request.picture
            logger.info(f"Using direct auth for testing: {email}")
        else:
            # Production: Verify Google ID token
            if not google_client_id or google_client_id == "your-google-client-id.apps.googleusercontent.com":
                return AuthResponse(
                    success=False,
                    error="Google OAuth not configured. Please set GOOGLE_CLIENT_ID in .env"
                )

            try:
                idinfo = id_token.verify_oauth2_token(
                    login_request.token,
                    google_requests.Request(),
                    google_client_id
                )
                google_id = idinfo["sub"]
                email = idinfo.get("email")
                name = idinfo.get("name", email)
                picture = idinfo.get("picture")
            except ValueError as e:
                logger.error(f"Invalid Google token: {e}")
                return AuthResponse(success=False, error="Invalid Google token")

        if not email:
            return AuthResponse(success=False, error="Email not provided by Google")

        # Get or create user in database
        db = _ensure_db(request)
        user = await db.users.find_one({"google_id": google_id})

        if user:
            # Update last login
            await db.users.update_one(
                {"google_id": google_id},
                {"$set": {"last_login": datetime.now(timezone.utc)}}
            )
        else:
            # Create new user
            user_model = UserModel(
                email=email,
                name=name,
                picture=picture,
                google_id=google_id
            )
            await db.users.insert_one(user_model.model_dump())
            user = user_model.model_dump()

        # Create JWT token
        access_token = create_access_token({"user_id": user["id"], "email": email})

        return AuthResponse(
            success=True,
            access_token=access_token,
            user={
                "id": user["id"],
                "email": email,
                "name": name,
                "picture": picture
            }
        )

    except Exception as e:
        logger.exception("Error in Google login")
        return AuthResponse(success=False, error=str(e))


@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user."""
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture")
        }
    }


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate, request: Request):
    db = _ensure_db(request)
    status_obj = StatusCheck(**input.model_dump())
    await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(request: Request):
    db = _ensure_db(request)
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(chat_request: ChatRequest, request: Request):
    try:
        agent = await _get_or_create_agent(request, chat_request.agent_type)
        response = await agent.execute(chat_request.message)

        return ChatResponse(
            success=response.success,
            response=response.content,
            agent_type=chat_request.agent_type,
            capabilities=agent.get_capabilities(),
            metadata=response.metadata,
            error=response.error,
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in chat endpoint")
        return ChatResponse(
            success=False,
            response="",
            agent_type=chat_request.agent_type,
            capabilities=[],
            error=str(exc),
        )


@api_router.post("/search", response_model=SearchResponse)
async def search_and_summarize(search_request: SearchRequest, request: Request):
    try:
        search_agent = await _get_or_create_agent(request, "search")
        search_prompt = (
            f"Search for information about: {search_request.query}. "
            "Provide a comprehensive summary with key findings."
        )
        result = await search_agent.execute(search_prompt, use_tools=True)

        if result.success:
            metadata = result.metadata or {}
            return SearchResponse(
                success=True,
                query=search_request.query,
                summary=result.content,
                search_results=metadata,
                sources_count=int(metadata.get("tool_run_count", metadata.get("tools_used", 0)) or 0),
            )

        return SearchResponse(
            success=False,
            query=search_request.query,
            summary="",
            sources_count=0,
            error=result.error,
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in search endpoint")
        return SearchResponse(
            success=False,
            query=search_request.query,
            summary="",
            sources_count=0,
            error=str(exc),
        )


@api_router.get("/agents/capabilities")
async def get_agent_capabilities(request: Request):
    try:
        search_agent = await _get_or_create_agent(request, "search")
        chat_agent = await _get_or_create_agent(request, "chat")

        return {
            "success": True,
            "capabilities": {
                "search_agent": search_agent.get_capabilities(),
                "chat_agent": chat_agent.get_capabilities(),
            },
        }
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error getting capabilities")
        return {"success": False, "error": str(exc)}


# News API endpoints
@api_router.post("/news/scrape")
async def scrape_news(scrape_request: NewsScrapeRequest, request: Request):
    """Scrape news articles from provided URLs and save to database."""
    db = _ensure_db(request)
    scraper = request.app.state.news_scraper
    summarizer = request.app.state.news_summarizer

    scraped_articles = []
    failed_urls = []
    error_details = {}

    for url in scrape_request.urls:
        try:
            logger.info(f"Starting scrape for: {url}")

            # Scrape article with timeout
            article = scraper.scrape_article(url)
            if not article:
                logger.warning(f"Failed to scrape: {url}")
                failed_urls.append(url)
                error_details[url] = "Could not extract article content. Website may be blocking automated access."
                continue

            # Check if AI summarization is enabled
            use_ai = os.getenv("USE_AI_SUMMARIZATION", "false").lower() == "true"

            if use_ai:
                logger.info(f"Scraped article: {article.title[:50]}, starting AI summarization...")
                # Summarize and categorize with 15 second timeout
                try:
                    ai_result = await summarizer.summarize_and_categorize(article, timeout=15)
                except Exception as ai_error:
                    logger.warning(f"AI summarization error, using fallback: {ai_error}")
                    # Use fallback if AI fails completely
                    ai_result = {
                        "summary": summarizer._fallback_summary(article.content),
                        "category": summarizer._guess_category(article.title, article.content)
                    }
            else:
                logger.info(f"Scraped article: {article.title[:50]}, using fast fallback (AI disabled)")
                # Use fallback directly (much faster)
                ai_result = {
                    "summary": summarizer._fallback_summary(article.content),
                    "category": summarizer._guess_category(article.title, article.content)
                }

            # Create article model
            article_model = NewsArticleModel(
                title=article.title,
                summary=ai_result["summary"],
                category=ai_result["category"],
                source_url=article.source_url,
                source_name=article.source_name,
                image_url=article.image_url,
                published_at=article.published_at,
            )

            # Save to database
            await db.news_articles.insert_one(article_model.model_dump())
            scraped_articles.append(article_model)
            logger.info(f"✅ Successfully saved article: {article.title[:50]}")

        except Exception as e:
            logger.error(f"Error processing {url}: {e}", exc_info=True)
            failed_urls.append(url)
            error_details[url] = str(e)

    message = f"Successfully scraped {len(scraped_articles)} article(s)."
    if failed_urls:
        message += f" {len(failed_urls)} URL(s) failed."

    return {
        "success": True,
        "scraped_count": len(scraped_articles),
        "failed_count": len(failed_urls),
        "articles": scraped_articles,
        "failed_urls": failed_urls,
        "error_details": error_details,
        "message": message
    }


@api_router.get("/news", response_model=List[NewsArticleModel])
async def get_news(request: Request, category: Optional[str] = None, limit: int = 50):
    """Get news articles with optional category filter."""
    db = _ensure_db(request)

    query = {}
    if category:
        query["category"] = category

    articles = (
        await db.news_articles.find(query)
        .sort("published_at", -1)
        .limit(limit)
        .to_list(limit)
    )

    return [NewsArticleModel(**article) for article in articles]


@api_router.get("/news/{article_id}", response_model=NewsArticleModel)
async def get_news_article(article_id: str, request: Request):
    """Get a single news article by ID."""
    db = _ensure_db(request)

    article = await db.news_articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return NewsArticleModel(**article)


@api_router.delete("/news/{article_id}")
async def delete_news_article(article_id: str, request: Request):
    """Delete a news article."""
    db = _ensure_db(request)

    result = await db.news_articles.delete_one({"id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")

    return {"success": True, "message": "Article deleted"}


@api_router.get("/news/categories/list")
async def get_categories():
    """Get list of available news categories."""
    return {
        "categories": ["Technology", "Business", "Sports"],
        "default": "Business",
    }


@api_router.post("/news/create", response_model=NewsArticleModel)
async def create_news_article(article_data: ManualNewsArticleCreate, request: Request):
    """Create a news article manually with optional image upload."""
    db = _ensure_db(request)

    # Use image_base64 if provided, otherwise use image_url
    final_image_url = article_data.image_url
    if article_data.image_base64:
        # Store base64 image directly
        final_image_url = article_data.image_base64

    # Create article model
    article_model = NewsArticleModel(
        title=article_data.title,
        summary=article_data.summary,
        category=article_data.category,
        source_url=article_data.source_url,
        source_name=article_data.source_name,
        image_url=final_image_url,
    )

    # Save to database
    await db.news_articles.insert_one(article_model.model_dump())
    logger.info(f"Manually created article: {article_data.title}")

    return article_model


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
