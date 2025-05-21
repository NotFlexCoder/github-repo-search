import cheerio from 'cheerio'
import fetch from 'node-fetch'

export default async function handler(req, res) {
  const { user, repo } = req.query

  if (!user || !repo) {
    res.status(400).json({ error: "Missing user or repo parameter" })
    return
  }

  const url = `https://github.com/${user}/${repo}`
  const response = await fetch(url)

  if (!response.ok) {
    res.status(response.status).json({ error: "Repository not found or GitHub blocked the request" })
    return
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const getText = (selector) => $(selector).first().text().trim().replace(/,/g, '')

  const stars = getText('a[href$="/stargazers"]')
  const forks = getText('a[href$="/network/members"]')
  const watchers = getText('a[href$="/watchers"]')
  const issues = getText('a[href$="/issues"]')

  res.status(200).json({
    user,
    repo,
    stars,
    forks,
    watchers,
    open_issues: issues,
    url
  })
}
