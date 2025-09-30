import { useState, useEffect } from "react";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  LogOut,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8001";
const API = `${API_BASE}/api`;

const categoryColors = {
  Technology: "bg-blue-500",
  Business: "bg-green-500",
  Sports: "bg-orange-500",
};

const Admin = () => {
  const { user, login, logout, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scrapeUrls, setScrapeUrls] = useState("");
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoginError(null);

        // Get user info from Google
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );

        // Login with our backend using Google ID and user info
        const result = await login(userInfo.data.sub, {
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
        });

        if (!result.success) {
          setLoginError(result.error || "Login failed");
        }
      } catch (error) {
        console.error("Login failed:", error);
        setLoginError(error.response?.data?.message || error.message);
      }
    },
    onError: (error) => {
      console.error("Google login error:", error);
      setLoginError("Google login failed. Please try again.");
    },
  });

  useEffect(() => {
    if (user) {
      fetchArticles();
    }
  }, [user]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/news`);
      setArticles(response.data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    const urls = scrapeUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      alert("Please enter at least one URL");
      return;
    }

    try {
      setScraping(true);
      setScrapeResult(null);
      const response = await axios.post(`${API}/news/scrape`, { urls });
      setScrapeResult(response.data);
      setScrapeUrls("");
      // Refresh articles list
      fetchArticles();
    } catch (error) {
      console.error("Error scraping:", error);
      setScrapeResult({
        success: false,
        error: error.message,
      });
    } finally {
      setScraping(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      await axios.delete(`${API}/news/${articleId}`);
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Failed to delete article");
    }
  };

  const sampleUrls = [
    "https://www.bbc.com/news/articles/c20gk72z33go",
    "https://www.thehindu.com/business/",
    "https://indianexpress.com/section/technology/",
  ].join("\n");

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Settings className="w-16 h-16 text-blue-600" />
            </div>
            <CardTitle className="text-3xl">Admin Panel</CardTitle>
            <p className="text-gray-600 mt-2">
              Sign in with Google to access the admin panel
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loginError && (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-700">
                  {loginError}
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={() => googleLogin()}
              className="w-full gap-2 h-12 text-base"
              size="lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
            <div className="text-center">
              <a href="/" className="text-sm text-blue-600 hover:underline">
                ← Back to Home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">
                  {user.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              <a href="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scrape Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Scrape News
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Enter URLs (one per line)
                  </label>
                  <textarea
                    value={scrapeUrls}
                    onChange={(e) => setScrapeUrls(e.target.value)}
                    placeholder={sampleUrls}
                    className="w-full min-h-[200px] p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <Button
                  onClick={handleScrape}
                  disabled={scraping}
                  className="w-full"
                >
                  {scraping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Scrape Articles
                    </>
                  )}
                </Button>

                {scrapeResult && (
                  <Alert
                    className={
                      scrapeResult.success && scrapeResult.scraped_count > 0
                        ? "border-green-500 bg-green-50"
                        : scrapeResult.failed_count > 0 && scrapeResult.scraped_count > 0
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-red-500 bg-red-50"
                    }
                  >
                    <AlertDescription>
                      {scrapeResult.success ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {scrapeResult.scraped_count > 0 ? (
                              <CheckCircle className="w-4 h-4 text-green-700" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-700" />
                            )}
                            <span className="font-semibold">
                              {scrapeResult.message || "Scraping completed!"}
                            </span>
                          </div>
                          <div className="text-sm">
                            <p>
                              ✅ Successfully scraped: {scrapeResult.scraped_count}
                            </p>
                            <p>❌ Failed: {scrapeResult.failed_count}</p>
                            {scrapeResult.failed_urls && scrapeResult.failed_urls.length > 0 && (
                              <div className="mt-2 text-xs">
                                <p className="font-semibold">Failed URLs:</p>
                                <ul className="list-disc list-inside">
                                  {scrapeResult.failed_urls.map((url, idx) => (
                                    <li key={idx} className="truncate">
                                      {url}
                                      {scrapeResult.error_details && scrapeResult.error_details[url] && (
                                        <span className="text-red-600 ml-1">
                                          ({scrapeResult.error_details[url]})
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                <p className="mt-2 text-yellow-600">
                                  💡 Tip: Some websites block automated scraping. Try direct article URLs instead of homepage URLs.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle className="w-4 h-4" />
                          <span>Error: {scrapeResult.error}</span>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p>💡 Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use direct article URLs for best results</li>
                    <li>AI will summarize to exactly 60 words</li>
                    <li>Articles are auto-categorized</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  All Articles ({articles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No articles yet. Start by scraping some URLs!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {articles.map((article) => (
                      <div
                        key={article.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                className={`${
                                  categoryColors[article.category]
                                } text-white`}
                              >
                                {article.category}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {article.source_name}
                              </span>
                            </div>
                            <h3 className="font-semibold mb-2 text-sm">
                              {article.title}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {article.summary}
                            </p>
                            <a
                              href={article.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              Source
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(article.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
