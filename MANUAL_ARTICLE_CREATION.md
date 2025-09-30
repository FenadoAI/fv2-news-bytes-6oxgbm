# Manual Article Creation Feature

## ✅ Feature Added: Upload Images While Adding News

You can now **manually create news articles** in the admin panel with **image upload** functionality!

## How to Use

### 1. Access Admin Panel
- Navigate to `/admin`
- Login with Google (or use development mode)

### 2. Create Article Manually
1. Look for the **"Add Article Manually"** section (left column)
2. Click **"Show"** to expand the form
3. Fill in the required fields:
   - **Title** * (required)
   - **Summary** * (60 words recommended, word counter included)
   - **Category** * (Technology / Business / Sports)
   - **Source Name** * (e.g., TechCrunch, BBC)
   - **Source URL** (optional)
   - **Image** (optional - upload or URL)

### 3. Upload Image
Two options for adding images:

**Option A: Upload Image**
- Click "Upload Image" button
- Select an image file (max 2MB)
- See live preview
- Click "Remove" to change image

**Option B: Use Image URL**
- Paste image URL in the text field
- No preview, but will display on homepage

### 4. Submit
- Click "Create Article" button
- Article will be saved and appear in the list immediately
- Form will auto-clear and hide after success

## Features

### ✨ What's Included
- ✅ **Image Upload**: Select files from your computer
- ✅ **File Validation**: Only images, max 2MB
- ✅ **Live Preview**: See image before submitting
- ✅ **Word Counter**: Track summary length
- ✅ **Category Dropdown**: Easy selection
- ✅ **Form Validation**: Required fields checked
- ✅ **Success Feedback**: Clear confirmation messages
- ✅ **Auto-Refresh**: Article list updates automatically
- ✅ **Collapsible UI**: Save screen space when not in use

### 📊 Field Details

| Field | Required | Description |
|-------|----------|-------------|
| Title | ✅ Yes | Article headline |
| Summary | ✅ Yes | 60-word summary (counter included) |
| Category | ✅ Yes | Technology, Business, or Sports |
| Source Name | ✅ Yes | Publication name |
| Source URL | ❌ No | Link to original article |
| Image | ❌ No | Upload file or paste URL |

## Technical Details

### Image Storage
- Uploaded images are converted to **base64** format
- Stored directly in MongoDB with article data
- No separate file storage needed
- Works seamlessly with URL-based images too

### File Limits
- **File Type**: Images only (jpg, png, gif, webp, etc.)
- **File Size**: Maximum 2MB
- **Validation**: Checked before upload

### API Endpoint
```
POST /api/news/create

Body:
{
  "title": "Article Title",
  "summary": "60-word summary...",
  "category": "Technology",
  "source_name": "Source Name",
  "source_url": "https://...",
  "image_url": "https://..." or null,
  "image_base64": "data:image/..." or null
}
```

## Screenshots (Visual Guide)

### Collapsed View
```
┌─────────────────────────────────────┐
│ ➕ Add Article Manually    [Show]  │
└─────────────────────────────────────┘
```

### Expanded Form
```
┌─────────────────────────────────────┐
│ ➕ Add Article Manually    [Hide]  │
├─────────────────────────────────────┤
│ Title *                             │
│ [____________Article title_______]  │
│                                     │
│ Summary (60 words) *                │
│ [___________________________]       │
│ [___________________________]       │
│ 45 words                            │
│                                     │
│ Category *                          │
│ [Technology ▼]                      │
│                                     │
│ Source Name *                       │
│ [_________TechCrunch_________]      │
│                                     │
│ Source URL                          │
│ [_______https://..._________]       │
│                                     │
│ Image                               │
│ [📤 Upload Image]                   │
│ ┌─────────────────┐                │
│ │  Image Preview  │ [Remove]       │
│ └─────────────────┘                │
│ Or paste image URL                  │
│ [_______________________]           │
│                                     │
│ [➕ Create Article]                 │
│                                     │
│ ✅ Article created successfully!   │
└─────────────────────────────────────┘
```

## Example Usage

### Creating a Tech Article
1. Title: "New AI Model Released by OpenAI"
2. Summary: "OpenAI has released a new AI model that shows significant improvements in reasoning and coding. The model, called GPT-5, demonstrates advanced capabilities in understanding complex problems and generating accurate solutions. Early tests show promising results across multiple domains." (50 words - add 10 more)
3. Category: Technology
4. Source: TechCrunch
5. URL: https://techcrunch.com/...
6. Image: Upload logo or screenshot

### Creating a Sports Article
1. Title: "India Wins Cricket World Cup Final"
2. Summary: "India secured victory in the Cricket World Cup final against Australia at Melbourne Cricket Ground. Captain Rohit Sharma led the team to a thrilling win with outstanding performances from key players. The victory marks India's third World Cup title in cricket history." (50 words - add 10 more)
3. Category: Sports
4. Source: ESPN
5. Image: Upload match photo

## Benefits

### For Admins
- ✅ **Quick Creation**: Add breaking news instantly
- ✅ **Full Control**: Custom content and images
- ✅ **No Scraping Needed**: Direct input
- ✅ **Better Quality**: Handcrafted summaries
- ✅ **Flexible Images**: Upload or URL

### For Users
- ✅ **Fresh Content**: More articles available
- ✅ **Better Images**: Custom selected photos
- ✅ **Quality Control**: Curated content
- ✅ **Diverse Sources**: Mix of scraped and manual

## Troubleshooting

### Image won't upload
- ✅ Check file is an image (jpg, png, gif, etc.)
- ✅ Ensure file is under 2MB
- ✅ Try a different image format
- ✅ Use image URL as alternative

### "Please fill in all required fields"
- ✅ Check Title is filled
- ✅ Check Summary is filled (recommended 60 words)
- ✅ Check Source Name is filled
- ✅ Category should be selected (defaults to Business)

### Article not appearing
- ✅ Wait a few seconds for auto-refresh
- ✅ Manually refresh the page
- ✅ Check the "All Articles" section below

## Files Modified

1. **Backend**:
   - `backend/server.py` - Added `/api/news/create` endpoint
   - Added `ManualNewsArticleCreate` model

2. **Frontend**:
   - `frontend/src/pages/Admin.jsx` - Added manual creation form
   - Imported Label, Textarea, Select components

## Summary

**Manual article creation with image upload is now fully functional!**

- 📝 Create articles directly in admin panel
- 🖼️ Upload images or use URLs
- ⚡ Fast and easy to use
- ✅ Fully tested and working

**Go to `/admin` and click "Show" in the "Add Article Manually" section to try it out!** 🚀
