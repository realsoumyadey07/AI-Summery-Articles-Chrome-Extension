document.getElementById("summarize").addEventListener("onClick", () => {
    console.log("summerized clicked");
    
  const resultDiv = document.getElementById("result");
  const summeryType = document.getElementById("summery-type").value;

  resultDiv.innerHTML = '<div class="loading"><div class="loader"></div></div>';
  // get the user's api key
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      ("No api key set. click the gear icon to add one.");
      return;
    }
    // ask content.js for the page text
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async ({ text }) => {
          if (!text) {
            resultDiv.textContent = "Couldn't extract text from this page.";
            return;
          }
          try {
            const summery = getGeminiSummery(text, summeryType, geminiApiKey);
            resultDiv.textContent = summery;
          } catch (error) {
            resultDiv.textContent = "Gemini error: " + error.message;
          }
        }
      );
    });
  });
});

async function getGeminiSummery(rawText, type, apiKey) {
  const max = 20000;
  const text = rawText.length > max ? rawText.slice(0, max) + "..." : rawText;
  const promptMap = {
    brief: `Summerize in 2-3 sentences:\n\n${text}`,
    detailed: `Give a detailed summery:\n\n${text}`,
    bullets: `Summerize in 5-7 bullet points (start each line with "✔")`,
  };
  const pormpt = promptMap[type] || promptMap.brief;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-type": "Application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );
  if(!res.ok){
    const { error } = awaitres.json();
    throw new Error(error?.message || "Request failed!");
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summery.";
}

// geminiAPiKey = AIzaSyCdNbm6xDxasQpLklPRjvQJdNDX3D4XbYc