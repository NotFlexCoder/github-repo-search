const https = require('https')
const cache = {}
const CACHE_TTL = 10000

module.exports = async (req, res) => {
  let { q = '', sort = 'stars', order = 'desc', page = 1, per_page = 10, language = '', license = '', topic = '', callback } = req.query
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' })
  q = q.trim().split(/\s+/).map(kw => `${kw} in:name,description`).join('+')
  if (language) q += `+language:${language}`
  if (license) q += `+license:${license}`
  if (topic) q += `+topic:${topic}`

  page = Math.min(Math.max(parseInt(page) || 1, 1), 100)
  per_page = Math.min(Math.max(parseInt(per_page) || 10, 1), 100)
  const cacheKey = `${q}_${sort}_${order}_${page}_${per_page}`
  const now = Date.now()
  if (cache[cacheKey] && now - cache[cacheKey].time < CACHE_TTL) {
    const cached = cache[cacheKey].data
    sendResponse(res, cached, callback)
    return
  }

  const apiUrl = `https://api.github.com/search/repositories?q=${q}&sort=${sort}&order=${order}&page=${page}&per_page=${per_page}`
  const options = { headers: { 'User-Agent': 'GitHub-Repo-Search' } }
  https.get(apiUrl, options, apiRes => {
    let data = ''
    apiRes.on('data', chunk => data += chunk)
    apiRes.on('end', () => {
      try {
        const rateLimit = {
          limit: apiRes.headers['x-ratelimit-limit'],
          remaining: apiRes.headers['x-ratelimit-remaining'],
          reset: apiRes.headers['x-ratelimit-reset']
        }
        const result = JSON.parse(data)
        if (!result.items) return res.status(500).json({ error: 'Unexpected API error' })
        const output = {
          total_count: result.total_count,
          incomplete_results: result.incomplete_results,
          page: page,
          per_page: per_page,
          items: result.items.map(repo => ({
            name: repo.name,
            full_name: repo.full_name,
            owner: repo.owner.login,
            avatar: repo.owner.avatar_url,
            url: repo.html_url,
            description: repo.description,
            language: repo.language,
            license: repo.license ? repo.license.spdx_id : null,
            topics: repo.topics,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            issues: repo.open_issues_count,
            created_at: repo.created_at,
            updated_at: repo.updated_at
          })),
          rate_limit: rateLimit
        }
        cache[cacheKey] = { time: now, data: output }
        sendResponse(res, output, callback)
      } catch {
        res.status(500).json({ error: 'Failed to parse GitHub response' })
      }
    })
  }).on('error', () => {
    res.status(500).json({ error: 'Failed to fetch from GitHub' })
  })
}

function sendResponse(res, data, callback) {
  if (callback) {
    res.setHeader('Content-Type', 'application/javascript')
    res.status(200).send(`${callback}(${JSON.stringify(data)})`)
  } else {
    res.setHeader('Content-Type', 'application/json')
    res.status(200).json(data)
  }
}
