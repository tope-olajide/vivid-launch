require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach(m => {
        if (m.name.includes('gemini')) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("Error response:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

listModels();
