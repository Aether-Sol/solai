export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;
    
    // Process the request using your secret API key
    const aiResponse = await fetch('URL_OF_YOUR_CHOSEN_AI_API', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.MY_SECRET_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ /* payload required by your chosen AI */ })
    });

    const data = await aiResponse.json();
    
    // Send the AI's response back to your frontend
    res.status(200).json({ reply: data.choices[0].message.content }); 
}
