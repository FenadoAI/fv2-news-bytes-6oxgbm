import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8001";
const API = `${API_BASE}/api`;

const categoryColors = {
  Technology: "bg-blue-500 hover:bg-blue-600",
  Business: "bg-green-500 hover:bg-green-600",
  Sports: "bg-orange-500 hover:bg-orange-600",
};

const NewsCard = ({ article }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {article.image_url && (
        <div className="h-48 overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={`${categoryColors[article.category]} text-white`}>
            {article.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {article.source_name}
          </span>
        </div>
        <h3 className="text-lg font-bold line-clamp-2">{article.title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {article.summary}
        </p>
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
        >
          Read full article
          <ExternalLink className="w-3 h-3" />
        </a>
      </CardContent>
    </Card>
  );
};

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchNews();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/news/categories/list`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchNews = async (category = null) => {
    try {
      setLoading(true);
      const params = category ? { category } : {};
      const response = await axios.get(`${API}/news`, { params });
      setArticles(response.data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      fetchNews();
    } else {
      setSelectedCategory(category);
      fetchNews(category);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">NewsShorts</h1>
            </div>
            <a
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Category Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => handleCategoryClick(null)}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => handleCategoryClick(category)}
                className={`rounded-full ${
                  selectedCategory === category
                    ? categoryColors[category]
                    : ""
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* News Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading news...</p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Newspaper className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No articles yet
            </h2>
            <p className="text-gray-600 mb-4">
              Add some news articles from the admin page
            </p>
            <a href="/admin">
              <Button>Go to Admin</Button>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              NewsShorts - Your daily dose of news in 60 words
            </p>
            <a
              href="/admin"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Admin Panel
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
