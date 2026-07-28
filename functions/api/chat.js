export async function onRequestPost(context) {
    try {
        const secretKey = context.env.MY_SECRET_API_KEY;
        const requestData = await context.request.json().catch(() => ({}));
        const userPrompt = requestData.prompt;
        
        // Check if the prompt was actually sent from the frontend
        if (!userPrompt) {
            return new Response(JSON.stringify({ reply: "API Error: Prompt is missing or empty." }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "You are a helpful assistant. STRICT FORMATTING RULES: 1. Never use markdown asterisks or bold syntax (like **). 2. Never write long continuous paragraphs. 3. Always format your answers line-by-line using clear bullet points (•) with line breaks so it is easy to read and listen to." 
                    },
                    { role: "user", content: userPrompt }
                ]
            })
        });

        const data = await aiResponse.json();
        
        if (!aiResponse.ok) {
            return new Response(JSON.stringify({ reply: "API Error: " + (data.error?.message || "Unknown error") }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const replyText = data.choices[0].message.content;
        
        return new Response(JSON.stringify({ reply: replyText }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ reply: "Server Error: " + err.message }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
