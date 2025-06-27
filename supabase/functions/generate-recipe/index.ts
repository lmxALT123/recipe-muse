
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, cookingTime } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not found');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced content filtering
    const sanitizedPrompt = prompt.trim().toLowerCase();
    
    // Forbidden keywords that are clearly not food-related
    const forbiddenKeywords = ['bomb', 'explosive', 'weapon', 'drug', 'poison'];
    
    if (forbiddenKeywords.some(keyword => sanitizedPrompt.includes(keyword))) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipe request. Please ask for food recipes only.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for obvious non-recipe requests
    const nonRecipePatterns = [
      /^\d+[\s]*[\+\-\*\/]\s*\d+/,  // Math operations like "2+2", "10-5"
      /what is \d+/,                // "what is 2+2"
      /solve|calculate|math|equation/,
      /tell me about|who is|what is.*(?!recipe|food|cooking|ingredient)/,
      /weather|time|date|today/,
      /how old|when was.*born/,
      /capital of|country|president/,
      /programming|code|javascript|python/,
      /movie|song|book|game/,
    ];

    const isNonRecipeRequest = nonRecipePatterns.some(pattern => pattern.test(sanitizedPrompt));
    
    if (isNonRecipeRequest) {
      return new Response(
        JSON.stringify({ 
          error: "Sorry, I'm an AI built specifically for recipes and cooking. I can't assist you with that. Please ask me about food recipes, cooking techniques, or ingredients instead!" 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the prompt contains any food-related keywords
    const foodKeywords = [
      'recipe', 'cook', 'bake', 'fry', 'grill', 'roast', 'steam', 'boil',
      'ingredient', 'spice', 'seasoning', 'sauce', 'soup', 'salad', 'pasta',
      'chicken', 'beef', 'pork', 'fish', 'vegetable', 'fruit', 'cheese',
      'bread', 'rice', 'noodle', 'curry', 'stir', 'marinade', 'dessert',
      'breakfast', 'lunch', 'dinner', 'snack', 'appetizer', 'main course',
      'side dish', 'meal', 'dish', 'food', 'cuisine', 'flavor', 'taste',
      'oven', 'pan', 'pot', 'kitchen', 'prepare', 'serve', 'eat', 'delicious'
    ];

    const containsFoodKeywords = foodKeywords.some(keyword => sanitizedPrompt.includes(keyword));
    
    if (!containsFoodKeywords && sanitizedPrompt.length > 10) {
      // If it's a longer request without food keywords, it's likely not recipe-related
      return new Response(
        JSON.stringify({ 
          error: "I can only help with recipes and cooking! Please ask me about food recipes, cooking techniques, or ingredients." 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timeConstraint = cookingTime === 'long' ? 
      'The recipe should take 1-3 hours to prepare and cook.' : 
      'The recipe should take 15-45 minutes to prepare and cook.';

    const systemPrompt = `You are a professional chef and recipe creator. You ONLY help with recipes and cooking-related topics.

IMPORTANT RULES:
- If the user asks ANYTHING that is not related to food, recipes, cooking, ingredients, or kitchen techniques, you MUST respond with: "Sorry, I'm an AI built specifically for recipes and cooking. I can't assist you with that. Please ask me about food recipes, cooking techniques, or ingredients instead!"
- Do NOT answer math questions, general knowledge questions, or any non-food topics
- ONLY respond to requests about recipes, cooking methods, ingredients, food preparation, or culinary techniques
- If unsure whether a request is food-related, err on the side of caution and decline

For valid recipe requests:
- ${timeConstraint}
- Provide realistic cooking times and serving sizes
- Include practical cooking tips
- Use common ingredients when possible
- Make instructions clear and step-by-step

CRITICAL: You MUST respond with ONLY a valid JSON object for recipe requests. For non-recipe requests, respond with the rejection message above. Return EXACTLY this structure for recipes:

{
  "title": "Recipe Name",
  "cooking_time": "25 minutes",
  "serving_size": "4 people",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "cooking_tips": "Helpful tips for best results",
  "cuisine_style": "Italian/Asian/American/etc"
}`;

    console.log('Attempting to generate recipe with prompt:', prompt);

    let lastError = null;
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${MAX_RETRIES} - Sending request to Gemini`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUser request: ${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
              topP: 0.9,
              topK: 40
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API error (attempt ${attempt}):`, response.status, errorText);
          lastError = new Error(`Gemini API returned ${response.status}: ${errorText}`);
          
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY * attempt); // Exponential backoff
            continue;
          }
          throw lastError;
        }

        const data = await response.json();
        const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!generatedContent) {
          console.error('No content generated by Gemini');
          lastError = new Error('No recipe content generated');
          
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY * attempt);
            continue;
          }
          throw lastError;
        }

        console.log(`Gemini response (attempt ${attempt}):`, generatedContent);

        // Check if AI declined the request
        if (generatedContent.includes("Sorry, I'm an AI built specifically for recipes")) {
          return new Response(
            JSON.stringify({ 
              error: "Sorry, I'm an AI built specifically for recipes and cooking. I can't assist you with that. Please ask me about food recipes, cooking techniques, or ingredients instead!" 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Enhanced JSON parsing with multiple fallback strategies
        let recipe;
        try {
          // Strategy 1: Direct parsing
          recipe = JSON.parse(generatedContent);
        } catch (parseError1) {
          try {
            // Strategy 2: Clean markdown formatting
            const cleanedContent = generatedContent
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .replace(/^\s*[\r\n]/gm, '')
              .trim();
            recipe = JSON.parse(cleanedContent);
          } catch (parseError2) {
            try {
              // Strategy 3: Extract JSON from text
              const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                recipe = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('No valid JSON found in response');
              }
            } catch (parseError3) {
              console.error(`JSON parsing failed (attempt ${attempt}):`, parseError3);
              lastError = new Error('Failed to parse recipe data from AI response');
              
              if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY * attempt);
                continue;
              }
              throw lastError;
            }
          }
        }

        // Validate recipe structure with more flexibility
        if (!recipe || typeof recipe !== 'object') {
          lastError = new Error('Invalid recipe format: not an object');
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY * attempt);
            continue;
          }
          throw lastError;
        }

        // Ensure required fields exist with defaults
        const validatedRecipe = {
          title: recipe.title || 'Generated Recipe',
          cooking_time: recipe.cooking_time || recipe.cookingTime || '30 minutes',
          serving_size: recipe.serving_size || recipe.servingSize || '4 people',
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : ['Ingredients list not available'],
          instructions: Array.isArray(recipe.instructions) ? recipe.instructions : ['Instructions not available'],
          cooking_tips: recipe.cooking_tips || recipe.cookingTips || 'Enjoy your cooking!',
          cuisine_style: recipe.cuisine_style || recipe.cuisineStyle || 'International'
        };

        console.log('Successfully generated and validated recipe:', validatedRecipe.title);

        return new Response(
          JSON.stringify({ recipe: validatedRecipe }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        lastError = error;
        console.error(`Error in attempt ${attempt}:`, error);
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY * attempt}ms...`);
          await sleep(RETRY_DELAY * attempt);
          continue;
        }
      }
    }

    // If we get here, all retries failed
    console.error('All retry attempts failed. Last error:', lastError);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate recipe after multiple attempts. Please try again.',
        details: lastError?.message || 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
