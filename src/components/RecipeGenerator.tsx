
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, Users, ChefHat, Heart, Sparkles, RefreshCw } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface RecipeGeneratorProps {
  user: User;
}

interface Recipe {
  id?: string;
  title: string;
  cooking_time: string;
  serving_size: string;
  ingredients: string[];
  instructions: string[];
  cooking_tips: string;
  prompt: string;
  cooking_type: 'normal' | 'long';
  created_at?: string;
  cuisine_style?: string;
}

export const RecipeGenerator = ({ user }: RecipeGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cookingTime, setCookingTime] = useState<'normal' | 'long'>('normal');
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isNonRecipeError, setIsNonRecipeError] = useState(false);

  const generateRecipe = async (isRetry = false) => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a recipe request",
        description: "Describe what you'd like to cook!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    if (!isRetry) {
      setRetryCount(0);
      setIsNonRecipeError(false);
    }

    try {
      console.log('Generating recipe with AI for prompt:', prompt);
      
      // Add a longer timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: {
          prompt: prompt.trim(),
          cookingTime: cookingTime
        }
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error('Supabase function error:', error);
        
        // Check if it's a network/timeout error and suggest retry
        if (error.message?.includes('timeout') || error.message?.includes('network') || error.status >= 500) {
          toast({
            title: "Connection issue",
            description: "The AI service is taking longer than usual. Click 'Retry' to try again.",
            variant: "destructive"
          });
          setRetryCount(prev => prev + 1);
          setIsNonRecipeError(false);
          return;
        }
        
        toast({
          title: "Error generating recipe",
          description: error.message || "Failed to connect to AI service. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (!data?.recipe) {
        console.error('No recipe data received:', data);
        
        // Check if it's a non-recipe error message
        const errorMessage = data?.error || "Received invalid response from AI service.";
        const isNonRecipeRequest = errorMessage.includes("I'm an AI built specifically for recipes") || 
                                   errorMessage.includes("I can only help with recipes and cooking");
        
        if (isNonRecipeRequest) {
          setIsNonRecipeError(true);
          setRetryCount(0); // Don't show retry for non-recipe requests
        } else {
          setIsNonRecipeError(false);
          setRetryCount(prev => prev + 1);
        }
        
        toast({
          title: isNonRecipeRequest ? "Invalid Request" : "Error generating recipe",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      const aiRecipe = data.recipe;
      
      // Create recipe object with AI-generated data
      const recipe: Recipe = {
        title: aiRecipe.title || 'Generated Recipe',
        cooking_time: aiRecipe.cooking_time || '30 minutes',
        serving_size: aiRecipe.serving_size || '4 people',
        ingredients: Array.isArray(aiRecipe.ingredients) ? aiRecipe.ingredients : [],
        instructions: Array.isArray(aiRecipe.instructions) ? aiRecipe.instructions : [],
        cooking_tips: aiRecipe.cooking_tips || 'Enjoy your cooking!',
        prompt: prompt,
        cooking_type: cookingTime,
        cuisine_style: aiRecipe.cuisine_style || 'International'
      };

      console.log('Generated recipe:', recipe);
      setCurrentRecipe(recipe);
      setRetryCount(0); // Reset retry count on success
      setIsNonRecipeError(false);

      toast({
        title: "Recipe generated!",
        description: "Your AI-powered recipe is ready to cook.",
      });

    } catch (error) {
      console.error('Error generating recipe:', error);
      
      const isNetworkError = error.name === 'AbortError' || 
                           error.message?.includes('fetch') || 
                           error.message?.includes('network');
      
      if (isNetworkError) {
        toast({
          title: "Connection timeout",
          description: "The request took too long. Please try again.",
          variant: "destructive"
        });
        setIsNonRecipeError(false);
      } else {
        toast({
          title: "Error generating recipe",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
        setIsNonRecipeError(false);
      }
      setRetryCount(prev => prev + 1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    generateRecipe(true);
  };

  const saveRecipe = async () => {
    if (!currentRecipe || !user) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: currentRecipe.title,
          description: currentRecipe.prompt,
          cooking_time: currentRecipe.cooking_time,
          serving_size: currentRecipe.serving_size,
          ingredients: currentRecipe.ingredients,
          instructions: currentRecipe.instructions,
          cooking_tips: currentRecipe.cooking_tips,
          cooking_type: currentRecipe.cooking_type,
          cuisine_style: currentRecipe.cuisine_style,
          is_saved: true
        });

      if (error) {
        toast({
          title: "Error saving recipe",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Recipe saved!",
          description: "Added to your personal recipe collection.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateTitle = (prompt: string) => {
    const keywords = prompt.toLowerCase().split(' ');
    const proteins = ['chicken', 'beef', 'pork', 'turkey', 'fish', 'tofu'];
    const styles = ['curry', 'stir-fry', 'soup', 'salad', 'pasta', 'rice'];
    
    let title = '';
    const foundProtein = proteins.find(p => keywords.includes(p));
    const foundStyle = styles.find(s => keywords.includes(s));
    
    if (foundProtein && foundStyle) {
      title = `${foundProtein.charAt(0).toUpperCase() + foundProtein.slice(1)} ${foundStyle.charAt(0).toUpperCase() + foundStyle.slice(1)}`;
    } else {
      title = prompt.split(' ').slice(0, 3).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    return title + ' Delight';
  };

  const generateIngredients = (prompt: string) => {
    const baseIngredients = [
      '2 tbsp olive oil',
      '1 medium onion, diced',
      '3 cloves garlic, minced',
      'Salt and pepper to taste'
    ];

    const keywords = prompt.toLowerCase();
    const extraIngredients = [];

    if (keywords.includes('chicken')) extraIngredients.push('1 lb chicken breast, cubed');
    if (keywords.includes('curry')) extraIngredients.push('2 tbsp curry powder', '1 can coconut milk');
    if (keywords.includes('pineapple')) extraIngredients.push('1 cup fresh pineapple chunks');
    if (keywords.includes('turkey')) extraIngredients.push('1 lb ground turkey');
    if (keywords.includes('rice')) extraIngredients.push('1 cup basmati rice');
    if (keywords.includes('vegetables')) extraIngredients.push('2 cups mixed vegetables');

    return [...baseIngredients, ...extraIngredients];
  };

  const generateInstructions = (prompt: string) => {
    return [
      'Heat olive oil in a large pan over medium-high heat.',
      'Add diced onion and cook until translucent, about 3-4 minutes.',
      'Add minced garlic and cook for another minute until fragrant.',
      'Add your main protein and cook until browned on all sides.',
      'Season with salt, pepper, and any spices mentioned in your request.',
      'Add any liquid ingredients and bring to a simmer.',
      'Reduce heat and let cook until flavors meld together.',
      'Taste and adjust seasoning as needed.',
      'Serve hot and enjoy your delicious creation!'
    ];
  };

  const generateTips = (prompt: string) => {
    const tips = [
      'For extra flavor, marinate your protein for 30 minutes before cooking.',
      'Fresh herbs added at the end will brighten up the dish.',
      'Don\'t overcrowd the pan - cook in batches if necessary.',
      'Let the dish rest for 5 minutes before serving to allow flavors to settle.'
    ];
    
    return tips.slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-1 sm:space-y-2 pt-2 sm:pt-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent px-2">
          What would you like to cook today?
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm md:text-base px-2">
          Describe any dish and I'll create a personalized recipe just for you!
        </p>
      </div>

      {/* Recipe Request Card */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mx-1 sm:mx-0">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg md:text-xl">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
            <span>Recipe Request</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm md:text-base">
            Be creative! Try "spicy chicken and pineapple curry" or "quick weeknight pasta"
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6">
          <Textarea
            placeholder="I want to make..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[70px] sm:min-h-[80px] md:min-h-[100px] text-sm sm:text-base md:text-lg resize-none"
          />

          {/* Cooking Time and Generate Button Section */}
          <div className="space-y-3 sm:space-y-4">
            {/* Cooking Time Preference */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-medium block">Cooking Time Preference</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={cookingTime === 'normal' ? 'default' : 'outline'}
                  onClick={() => setCookingTime('normal')}
                  className={`text-xs sm:text-sm h-9 sm:h-10 ${
                    cookingTime === 'normal' ? 'bg-orange-500 hover:bg-orange-600' : ''
                  }`}
                >
                  Normal (15-30 min)
                </Button>
                <Button
                  variant={cookingTime === 'long' ? 'default' : 'outline'}
                  onClick={() => setCookingTime('long')}
                  className={`text-xs sm:text-sm h-9 sm:h-10 ${
                    cookingTime === 'long' ? 'bg-orange-500 hover:bg-orange-600' : ''
                  }`}
                >
                  Long (1+ hours)
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {retryCount > 0 && !isNonRecipeError && (
                <Button
                  onClick={handleRetry}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 text-xs sm:text-sm h-9 sm:h-10"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  Retry
                </Button>
              )}
              
              <Button
                onClick={() => generateRecipe(false)}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold transition-all duration-200 text-xs sm:text-sm md:text-base h-10 sm:h-11"
              >
                {isGenerating ? (
                  <>
                    <ChefHat className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin flex-shrink-0" />
                    <span className="truncate">Cooking up magic...</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span>Generate Recipe</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Status Messages */}
          {retryCount > 0 && !isNonRecipeError && (
            <div className="text-xs sm:text-sm text-orange-600 bg-orange-50 p-2 sm:p-3 rounded-lg">
              <p>Having trouble? The AI service is sometimes busy. Try the retry button or rephrase your request.</p>
            </div>
          )}
          
          {isNonRecipeError && (
            <div className="text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded-lg">
              <p>Please ask me about food recipes, cooking techniques, or ingredients. I'm designed specifically to help with cooking!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Recipe Display */}
      {currentRecipe && (
        <Card className="shadow-xl border-0 bg-white mx-1 sm:mx-0">
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl md:text-2xl text-gray-800 mb-2 break-words leading-tight">
                  {currentRecipe.title}
                </CardTitle>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{currentRecipe.cooking_time}</span>
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Serves {currentRecipe.serving_size}</span>
                  </Badge>
                </div>
              </div>
              <Button
                onClick={saveRecipe}
                variant="outline"
                className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs sm:text-sm flex-shrink-0 h-9 sm:h-10"
              >
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                Save Recipe
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6">
            {/* Ingredients Section */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Ingredients</h3>
              <ul className="space-y-1 sm:space-y-2">
                {currentRecipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-xs sm:text-sm md:text-base break-words leading-relaxed">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions Section */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Instructions</h3>
              <ol className="space-y-2 sm:space-y-3">
                {currentRecipe.instructions.map((step, index) => (
                  <li key={index} className="flex space-x-2 sm:space-x-3">
                    <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 text-xs sm:text-sm md:text-base break-words flex-1 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Chef's Tips Section */}
            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">Chef's Tips</h3>
              <p className="text-gray-700 text-xs sm:text-sm break-words leading-relaxed">{currentRecipe.cooking_tips}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
