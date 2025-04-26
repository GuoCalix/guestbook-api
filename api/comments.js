export default async function handler(req, res) {
    const { GITHUB_TOKEN, REPO, OWNER } = process.env;

    const headers = {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
    };

    if (req.method === 'GET') {
        const sort = req.query.sort || 'created'; // created / comments / updated
        const direction = req.query.direction || 'desc';

        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues?labels=guestbook&sort=${sort}&direction=${direction}`, {
            headers
        });

        const data = await response.json();
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { title, body } = req.body;

        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title,
                body,
                labels: ['guestbook']
            })
        });

        const data = await response.json();
        return res.status(201).json(data);
    }

    res.status(405).json({ message: "Method not allowed" });
}
