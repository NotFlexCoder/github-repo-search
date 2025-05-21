export default async function handler(req, res) {
  const { user, repo } = req.query

  if (!user || !repo) {
    res.status(400).json({ error: "Missing user or repo parameter" })
    return
  }

  const response = await fetch(`https://api.github.com/repos/${user}/${repo}`, {
    headers: {
      'User-Agent': 'vercel-github-stats'
    }
  })

  if (!response.ok) {
    res.status(response.status).json({ error: "GitHub API error" })
    return
  }

  const data = await response.json()

  res.status(200).json({
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.subscribers_count,
    open_issues: data.open_issues_count,
    url: data.html_url
  })
}
