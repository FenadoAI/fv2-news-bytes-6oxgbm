import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  PlusCircle,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8001";
const API = `${API_BASE}/api`;

const categoryColors = {
  Technology: "bg-blue-500",
  Business: "bg-green-500",
  Sports: "bg-orange-500",
};

const Admin = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scrapeUrls, setScrapeUrls] = useState("");
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scraping, setScraping] = useState(false);

  // Manual article creation state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualArticle, setManualArticle] = useState({
    title: "",
    summary: "",
    category: "Business",
    source_url: "",
    source_name: "",
    image_url: "",
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateArticle = async () => {
    // Validation
    if (!manualArticle.title || !manualArticle.summary || !manualArticle.source_name) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setCreating(true);
      setCreateResult(null);

      const payload = {
        ...manualArticle,
        image_base64: uploadedImage, // Send base64 image if uploaded
      };

      const response = await axios.post(`${API}/news/create`, payload);

      if (response.data) {
        setCreateResult({
          success: true,
          message: "Article created successfully!",
        });
        // Reset form
        setManualArticle({
          title: "",
          summary: "",
          category: "Business",
          source_url: "",
          source_name: "",
          image_url: "",
        });
        setUploadedImage(null);
        setImagePreview(null);
        // Refresh articles
        fetchArticles();
        // Hide form after 2 seconds
        setTimeout(() => {
          setShowManualForm(false);
          setCreateResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating article:", error);
      setCreateResult({
        success: false,
        message: error.response?.data?.detail || "Failed to create article",
      });
    } finally {
      setCreating(false);
    }
  };

  const sampleUrls = [
    "https://www.bbc.com/news/articles/c20gk72z33go",
    "https://www.thehindu.com/business/",
    "https://indianexpress.com/section/technology/",
  ].join("\n");

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
            <a href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manual Article Creation */}
          <div className="lg:col-span-1">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Add Article Manually
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualForm(!showManualForm)}
                  >
                    {showManualForm ? "Hide" : "Show"}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showManualForm && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Article title"
                      value={manualArticle.title}
                      onChange={(e) =>
                        setManualArticle({ ...manualArticle, title: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="summary">Summary (60 words) *</Label>
                    <Textarea
                      id="summary"
                      placeholder="Write a 60-word summary..."
                      value={manualArticle.summary}
                      onChange={(e) =>
                        setManualArticle({ ...manualArticle, summary: e.target.value })
                      }
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {manualArticle.summary.split(" ").filter(Boolean).length} words
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={manualArticle.category}
                      onValueChange={(value) =>
                        setManualArticle({ ...manualArticle, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="source_name">Source Name *</Label>
                    <Input
                      id="source_name"
                      placeholder="e.g., TechCrunch, BBC"
                      value={manualArticle.source_name}
                      onChange={(e) =>
                        setManualArticle({ ...manualArticle, source_name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="source_url">Source URL</Label>
                    <Input
                      id="source_url"
                      placeholder="https://..."
                      value={manualArticle.source_url}
                      onChange={(e) =>
                        setManualArticle({ ...manualArticle, source_url: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Image</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("imageUpload").click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                        <input
                          id="imageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => {
                              setUploadedImage(null);
                              setImagePreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      <Input
                        placeholder="Or paste image URL"
                        value={manualArticle.image_url}
                        onChange={(e) =>
                          setManualArticle({ ...manualArticle, image_url: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateArticle}
                    disabled={creating}
                    className="w-full"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create Article
                      </>
                    )}
                  </Button>

                  {createResult && (
                    <Alert
                      className={
                        createResult.success
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                      }
                    >
                      <AlertDescription>
                        {createResult.success ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>{createResult.message}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700">
                            <XCircle className="w-4 h-4" />
                            <span>{createResult.message}</span>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              )}
            </Card>
          </div>

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
