import { aiProviderConfig } from '../config/aiProvider';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!aiProviderConfig.openRouter.apiKey) {
      return res.status(500).json({ error: 'Missing OpenRouter API key' });
    }

    const response = await fetch(`${aiProviderConfig.openRouter.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiProviderConfig.openRouter.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: aiProviderConfig.openRouter.model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
