# 🔍 GitHub Repository Search API

This lightweight Node.js API endpoint allows you to search GitHub repositories based on query parameters. It fetches repository data directly from the GitHub Search API and returns a clean, filtered JSON response. Ideal for integrating into bots, apps, or services that need GitHub repo info quickly.

## 🚀 Features

- ⚡ Fast and simple API endpoint using native Node.js `https` module.
- 🔎 Supports searching repos by query (`q`), sorting, ordering, pagination, and language filtering.
- 📄 Returns relevant repository details like name, owner, stars, forks, issues, and URLs.
- 🔐 Ready to use in serverless functions or any Node.js backend.

## 🛠️ Requirements

- Node.js v12 or higher.
- Any server environment capable of running Node.js modules.

## 📡 Usage

1. **Setup**:
   - Add the following code in your Node.js server or API route handler file:

     ```js
     const https = require('https')

     module.exports = async (req, res) => {
       let { q = '', sort = 'stars', order = 'desc', page = 1, per_page = 10, language = '' } = req.query
       if (!q) return res.status(400).json({ error: 'Missing query parameter q' })

       if (language) {
         language = language.trim()
         q += ` language:${language}`
       }

       const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}&per_page=${per_page}`
       const options = { headers: { 'User-Agent': 'GitHub-Repo-Search' } }

       https.get(apiUrl, options, apiRes => {
         let data = ''
         apiRes.on('data', chunk => data += chunk)
         apiRes.on('end', () => {
           const result = JSON.parse(data)
           if (!result.items) return res.status(500).json({ error: 'Unexpected API error' })
           const output = result.items.map(repo => ({
             name: repo.name,
             full_name: repo.full_name,
             owner: repo.owner.login,
             avatar: repo.owner.avatar_url,
             url: repo.html_url,
             description: repo.description,
             language: repo.language,
             stars: repo.stargazers_count,
             forks: repo.forks_count,
             issues: repo.open_issues_count,
             created_at: repo.created_at,
             updated_at: repo.updated_at
           }))
           res.setHeader('Content-Type', 'application/json')
           res.status(200).json(output)
         })
       }).on('error', () => {
         res.status(500).json({ error: 'Failed to fetch from GitHub' })
       })
     }
     ```

2. **Run your Node.js server** as usual.

3. **Make a GET request** to your endpoint with query parameters, for example:

```
/?q=nodejs&sort=stars&order=desc&page=1&per_page=5&language=javascript
```

## 📄 Example Response

```json
[
  {
    "name": "node",
    "full_name": "nodejs/node",
    "owner": "nodejs",
    "avatar": "https://avatars.githubusercontent.com/u/9950313?v=4",
    "url": "https://github.com/nodejs/node",
    "description": "Node.js JavaScript runtime",
    "language": "JavaScript",
    "stars": 102000,
    "forks": 26000,
    "issues": 1500,
    "created_at": "2014-02-10T21:51:28Z",
    "updated_at": "2025-05-20T10:00:00Z"
  }
]
```

## ⚠️ Error Handling

- Returns `400` if the required query parameter `q` is missing.
- Returns `500` if GitHub API fails or returns unexpected data.
- You can wrap the code in a try-catch block or add more robust error handling for production use.

## 🛠️ Notes

- GitHub API rate limits unauthenticated requests. Consider adding authentication headers if you expect high traffic.
- The `User-Agent` header is required by GitHub API to avoid request rejections.

## 📝 License

This project is licensed under the MIT License – see the [LICENSE](https://github.com/NotFlexCoder/github-repo-search/blob/main/LICENSE) file for details.
