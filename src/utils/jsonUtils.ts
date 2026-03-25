/**
 * Sanitizes a JSON string by removing common LLM artifacts like markdown code blocks.
 */
export const sanitizeJSON = (jsonString: string): string => {
  if (!jsonString) return '[]';
  
  // Remove markdown code blocks (e.g., ```json ... ``` or ``` ... ```)
  let sanitized = jsonString.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};
