export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    // 验证环境变量
    const { GITHUB_TOKEN, REPO, OWNER } = process.env
    if (!GITHUB_TOKEN || !REPO || !OWNER) {
        return res.status(500).json({ 
            error: 'Server configuration error' 
        })
    }

    const headers = {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
    }

    try {
        if (req.method === 'GET') {
            const sort = req.query.sort || 'created'
            const direction = req.query.direction || 'desc'
            
            const response = await fetch(
                `https://api.github.com/repos/${OWNER}/${REPO}/issues?labels=guestbook&sort=${sort}&direction=${direction}`,
                { headers }
            )
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`)
            }
            
            let data = await response.json()
            // 过滤掉 pull request
            data = data.filter(item => !item.pull_request)
            // 简化返回数据
            data = data.map(item => ({
                id: item.id,
                title: item.title,
                body: item.body,
                created_at: item.created_at,
                updated_at: item.updated_at,
                comments: item.comments
            }))
            
            return res.status(200).json(data)
        }

        if (req.method === 'POST') {
            const { title, body } = req.body
            
            if (!title || !body) {
                return res.status(400).json({ 
                    error: 'Title and body are required' 
                })
            }
            
            const response = await fetch(
                `https://api.github.com/repos/${OWNER}/${REPO}/issues`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        title,
                        body,
                        labels: ['guestbook']
                    })
                }
            )
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`)
            }
            
            const data = await response.json()
            return res.status(201).json({
                id: data.id,
                url: data.html_url,
                title: data.title,
                created_at: data.created_at
            })
        }

        return res.status(405).json({ 
            error: 'Method not allowed' 
        })
        
    } catch (error) {
        console.error('API Error:', error)
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        })
    }
}