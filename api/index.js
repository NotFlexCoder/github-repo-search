const https = require('https')

module.exports = async (req, res) => {
  const { q = '', sort = 'stars', order = 'desc', page = 1, per_page = 10 } = req.query
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' })
  const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}&per_page=${per_page}`

  const options = {
    headers: { 'User-Agent': 'GitHub-Repo-Search' }
  }

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
