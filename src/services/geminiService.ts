
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, ThinkingLevel } from "@google/genai";
export { Type, HarmCategory, HarmBlockThreshold, ThinkingLevel };
import { VSTPlugin, RecommendationResponse, BeatRecipe, SavedRecipe, Hardware } from "../types";

export const getAI = () => {
  const userKey = localStorage.getItem('bg_user_api_key');
  const apiKey = userKey?.trim() || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  return new GoogleGenAI({ apiKey });
};

export const validateApiKey = async (key: string): Promise<{valid: boolean, message?: string, cleanKey?: string}> => {
  try {
    const cleanKey = key.trim();
    if (!cleanKey) {
      return { valid: false, message: "Please enter an API key." };
    }

    const ai = new GoogleGenAI({ apiKey: cleanKey });
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hi"
    });
    
    return { valid: true, cleanKey };
  } catch (e: any) {
    console.error("API Key validation failed", e);
    
    const errorStr = (
      (e?.message || '') + ' ' + 
      (e?.error?.message || '') + ' ' + 
      (JSON.stringify(e) || '') + ' ' + 
      String(e)
    ).toLowerCase();
    
    if (errorStr.includes('api_key_http_referrer_blocked') || 
        errorStr.includes('requests from referer') ||
        errorStr.includes('api_key_ip_address_blocked') ||
        errorStr.includes('requests from this client are blocked') ||
        errorStr.includes('method doesn\'t allow unregistered callers')) {
      return { valid: true, cleanKey: key.trim() };
    }

    return { valid: false, message: `Google API Error: ${e.message || "Unknown error"}` };
  }
};

export const detectAPITier = async (key: string): Promise<'TIER_1' | 'FREE'> => {
  try {
    const cleanKey = key.trim();
    if (!cleanKey) return 'FREE';

    const ai = new GoogleGenAI({ apiKey: cleanKey });
    const result = await ai.models.list();

    if (!result) {
      return 'FREE';
    }

    return 'TIER_1';
  } catch (e) {
    console.error("Tier detection failed", e);
    return 'FREE';
  }
};

export const categorizeAndCompareLibraries = async (senderPlugins: VSTPlugin[], myPlugins: VSTPlugin[], thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH) => {
  const ai = getAI();
  const senderStr = senderPlugins.map(p => `${p.vendor} - ${p.name}`).join('\n');
  const receiverStr = myPlugins.map(p => `${p.vendor} - ${p.name}`).join('\n');

  const prompt = `
    Compare these two VST plugin libraries. 
    Categorize all plugins from BOTH lists into these specific categories: 
    'Instruments', 'Dynamics (Compressors/Limiters)', 'Frequency (EQ/Filters)', 'Spacial (Reverb/Delay)', and 'Creative FX'.
    
    Sender's Library:
    ${senderStr}

    My Library:
    ${receiverStr}

    For each category, list the plugins the Sender has that I AM MISSING (similar names don't count as missing).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                categoryName: { type: Type.STRING },
                senderPlugins: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingFromReceiver: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["categoryName", "senderPlugins", "missingFromReceiver"]
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"categories": []}');
};

const ANALOG_DESCRIPTIONS: Record<string, string> = {
  'Fender Jazzmaster': 'Bright, chimy, and percussive "surf" tone.',
  'Fender Stratocaster': 'Glassy, quacky, and transparent bright tone.',
  'ESP EX-50 (LTD)': 'Heavy, dense, fat, and full sound with humbucker pickups.',
  'Fender Precision Bass': 'Characteristic punchy "galloping" style and mid-range growl.',
  'Alhambra 7FC': 'Bright, aggressive flamenco attack.',
  'Yamaha C40': 'Warm, mellow nylon string tone.',
  'Korg Minilogue XD': 'Modern polyphonic analog warmth with digital multi-engine grit.',
  'Behringer TD-3': 'Classic squelchy 303 acid bass lines.',
  'UNO Synth': 'Aggressive, raw analog monophonic leads.',
  'Shure SM57': 'Industry standard dynamic mic, great for aggressive vocals or snare drums.',
  'Electro-Harmonix Big Muff': 'Iconic thick, creamy fuzz for guitars or synths.',
  'Orange Micro Dark': 'High-gain, aggressive tube-hybrid tone.',
  'Ampeg V-4B': 'Classic all-tube bass grit and punch.',
  'Heritage Audio 73 JR II': 'Classic 1073-style preamp warmth and saturation.',
  'Warm Audio WA76-D': 'Fast, aggressive FET compression.'
};

const generateDrumKitStr = (drumKits: Hardware[]): string => {
  if (drumKits.length === 0) return '';

  const kits = drumKits.filter(h => h.type === 'drumkit' && h.drumKitData);
  if (kits.length === 0) return '';

  const kitDescriptions = kits.map(kit => {
    const data = kit.drumKitData!;
    const parts = [
      { name: 'Kick', part: data.kick },
      { name: 'Snare', part: data.snare },
      { name: 'Toms', part: data.toms },
      { name: 'Hi-Hats', part: data.hiHats },
      { name: 'Cymbals', part: data.cymbals },
      ...(data.additionalParts || []).map((p, i) => ({ name: p.label || `Part ${i + 1}`, part: p }))
    ]
      .map(({ name, part }) => {
        if (!part.brand && !part.model) return null;
        return `- ${name.toUpperCase()}: ${part.brand} ${part.model} ${part.size ? `(${part.size})` : ''} - Tuning: ${part.tuning || 'N/A'}, Muffling: ${part.muffling || 'N/A'}`;
      })
      .filter(Boolean)
      .join('\n');

    return `
DRUM KIT: ${kit.name} (Main Brand: ${kit.vendor})
${parts}
    `;
  });

  return `\nCRITICAL: The user owns the following REAL DRUM KITS. You MUST prioritize using these in your recipes where appropriate.
  
  When generating a beat recipe, you MUST provide the 'drumKitAdvice' object with specific tuning and muffling advice for the Kick, Snare, and Toms based on the specific genre being generated. 
  For example, if the genre is "Modern Indie", you would provide detailed instructions on how the user should set their drums to achieve that sound (e.g., "Medium-low, more pressure on the pedal" for Kick, "Medium, very taut head" for Snare, "Low, controlled resonance" for Toms), and describe exactly how the user does that in very detailed instructions so they can achieve the correct sound as easily as possible.
  
  MUFFLING SUGGESTIONS:
  If a drum part is NOT already muffled in the user's drum kit settings (Muffling: N/A), you may suggest physical muffling (e.g., moon gel, tape, pillows) to achieve the target sound. 
  When suggesting physical muffling, include instructions on how to apply it.
  You MUST also provide an alternative using a specific plugin from the user's provided VST plugin list (e.g., a transient shaper, EQ, or tape emulation) and parameters to achieve a similar muffling/damping effect. Frame this as "OR achieve a similar effect with [Plugin Name]...". Do NOT call it a "backup".
  If the user does NOT have a suitable plugin in their gear rack to achieve this effect, DO NOT suggest physical muffling or a plugin alternative at all. Only suggest muffling if you can provide both the physical suggestion and a valid plugin alternative from their gear rack.

  RECORDING TIPS & CREATIVE SOUND SHAPING:
  When providing advice for the user's drum kit, you MUST generate a broad and diverse range of recording tips and creative sound shaping techniques tailored specifically to the requested genre.
  Provide PLENTY of detailed tips (at least 4-5 distinct tips), covering areas such as:
  - Microphone Selection & Placement (e.g., specific mic models, inside/outside kick, top/bottom snare, overhead configurations like Glyn Johns or ORTF, room mics).
  - Creative Sound Shaping & Dampening (e.g., wallet trick, towel kick, moon gel, tape, using blankets, removing resonant heads).
  - Room Acoustics & Processing (e.g., hallway mics, heavy compression, gating, saturation, parallel processing).
  Do not just repeat the same basic tips; offer unique, genre-appropriate studio secrets and techniques that will help the user achieve the exact sound of the genre.

  Available Drum Kits:
  ${kitDescriptions.join('\n')}`;
};

const generateAnalogStr = (analogInstruments: string[], analogHardware: string[], drumKits: Hardware[] = []): string => {
  const drumKitStr = generateDrumKitStr(drumKits);
  
  if (analogInstruments.length === 0 && analogHardware.length === 0) {
    return drumKitStr;
  }

  const selectedDescriptions: string[] = [];
  
  analogInstruments.forEach(instrument => {
    if (ANALOG_DESCRIPTIONS[instrument]) {
      selectedDescriptions.push(`- ${instrument}: ${ANALOG_DESCRIPTIONS[instrument]}`);
    }
  });

  analogHardware.forEach(hardware => {
    if (ANALOG_DESCRIPTIONS[hardware]) {
      selectedDescriptions.push(`- ${hardware}: ${ANALOG_DESCRIPTIONS[hardware]}`);
    }
  });

  let gearStr = '';
  if (selectedDescriptions.length > 0) {
    gearStr = `\nCRITICAL: The user owns the following REAL ANALOG HARDWARE. You MUST prioritize using these in your recipes where appropriate:\n${selectedDescriptions.join('\n')}`;
  } else {
    gearStr = `\nThe user has the following analog equipment, but no specific sonic characteristics were provided:\nInstruments: ${analogInstruments.join(', ')}\nHardware: ${analogHardware.join(', ')}`;
  }

  return gearStr + drumKitStr;
};

const getUnifiedRecipeSchema = () => {
  return {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      style: { type: Type.STRING },
      bpm: { type: Type.NUMBER },
      description: { type: Type.STRING },
      artistTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendedScale: { type: Type.STRING },
      chordProgression: { type: Type.STRING },
      mixingAdvice: { type: Type.STRING },
      drumKitAdvice: {
        type: Type.OBJECT,
        properties: {
          kick: { type: Type.STRING },
          snare: { type: Type.STRING },
          toms: { type: Type.STRING }
        },
        required: ["kick", "snare", "toms"]
      },
      instruments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            plugin: { type: Type.STRING },
            type: { type: Type.STRING },
            sourceSoundGoal: { type: Type.STRING },
            busSend: { type: Type.STRING },
            loopGuide: { type: Type.STRING },
            midiNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pitch: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  wait: { type: Type.STRING },
                  velocity: { type: Type.NUMBER }
                },
                required: ["pitch", "duration", "wait", "velocity"]
              }
            },
            deepDive: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parameter: { type: Type.STRING },
                  value: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["parameter", "value", "explanation"]
              }
            },
            fxPlugins: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  deepDive: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        parameter: { type: Type.STRING },
                        value: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ["parameter", "value", "explanation"]
                    }
                  }
                },
                required: ["name", "purpose", "deepDive"]
              }
            }
          },
          required: ["name", "plugin", "type", "sourceSoundGoal", "deepDive", "fxPlugins"]
        }
      },
      busses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tracksUsingBus: { type: Type.ARRAY, items: { type: Type.STRING } },
            fxPlugins: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  deepDive: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        parameter: { type: Type.STRING },
                        value: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ["parameter", "value", "explanation"]
                    }
                  }
                },
                required: ["name", "purpose", "deepDive"]
              }
            }
          },
          required: ["name", "tracksUsingBus", "fxPlugins"]
        }
      },
      drumPatterns: {
        type: Type.OBJECT,
        properties: {
          intro: { type: Type.OBJECT, properties: { kick: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, snare: { type: Type.OBJECT, properties: { isClap: { type: Type.BOOLEAN }, isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, hiHat: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, velocityHumanized: { type: Type.BOOLEAN }, swing: { type: Type.OBJECT, properties: { kick: { type: Type.NUMBER }, snare: { type: Type.NUMBER }, hiHat: { type: Type.NUMBER } } } } },
          verse: { type: Type.OBJECT, properties: { kick: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, snare: { type: Type.OBJECT, properties: { isClap: { type: Type.BOOLEAN }, isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, hiHat: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, velocityHumanized: { type: Type.BOOLEAN }, swing: { type: Type.OBJECT, properties: { kick: { type: Type.NUMBER }, snare: { type: Type.NUMBER }, hiHat: { type: Type.NUMBER } } } } },
          hook: { type: Type.OBJECT, properties: { kick: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, snare: { type: Type.OBJECT, properties: { isClap: { type: Type.BOOLEAN }, isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, hiHat: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, velocityHumanized: { type: Type.BOOLEAN }, swing: { type: Type.OBJECT, properties: { kick: { type: Type.NUMBER }, snare: { type: Type.NUMBER }, hiHat: { type: Type.NUMBER } } } } },
          bridge: { type: Type.OBJECT, properties: { kick: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, snare: { type: Type.OBJECT, properties: { isClap: { type: Type.BOOLEAN }, isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, hiHat: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, velocityHumanized: { type: Type.BOOLEAN }, swing: { type: Type.OBJECT, properties: { kick: { type: Type.NUMBER }, snare: { type: Type.NUMBER }, hiHat: { type: Type.NUMBER } } } } },
          outro: { type: Type.OBJECT, properties: { kick: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, snare: { type: Type.OBJECT, properties: { isClap: { type: Type.BOOLEAN }, isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, hiHat: { type: Type.OBJECT, properties: { isDoubleTime: { type: Type.BOOLEAN }, steps: { type: Type.ARRAY, items: { type: Type.NUMBER } } } }, velocityHumanized: { type: Type.BOOLEAN }, swing: { type: Type.OBJECT, properties: { kick: { type: Type.NUMBER }, snare: { type: Type.NUMBER }, hiHat: { type: Type.NUMBER } } } } }
        },
        required: ["intro", "verse", "hook", "bridge", "outro"]
      },
      arrangement: {
        type: Type.OBJECT,
        properties: {
          intro: { type: Type.STRING },
          verse: { type: Type.STRING },
          hook: { type: Type.STRING },
          bridge: { type: Type.STRING },
          outro: { type: Type.STRING }
        },
        required: ["intro", "verse", "hook", "bridge", "outro"]
      },
      masterPlugins: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            purpose: { type: Type.STRING },
            deepDive: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parameter: { type: Type.STRING },
                  value: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["parameter", "value", "explanation"]
              }
            }
          },
          required: ["name", "purpose", "deepDive"]
        }
      },
      isGangstaVox: { type: Type.BOOLEAN },
      gangstaVox: {
        type: Type.OBJECT,
        properties: {
          trackingChain: {
            type: Type.OBJECT,
            properties: {
              unisonPlugin: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  deepDive: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        parameter: { type: Type.STRING },
                        value: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ["parameter", "value", "explanation"]
                    }
                  }
                },
                required: ["name", "purpose", "deepDive"]
              },
              inserts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                    deepDive: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          parameter: { type: Type.STRING },
                          value: { type: Type.STRING },
                          explanation: { type: Type.STRING }
                        },
                        required: ["parameter", "value", "explanation"]
                      }
                    }
                  },
                  required: ["name", "purpose", "deepDive"]
                }
              },
              dspUsageNote: { type: Type.STRING }
            },
            required: ["inserts"]
          },
          vocalTracks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sourceSoundGoal: { type: Type.STRING },
                busSend: { type: Type.STRING },
                loopGuide: { type: Type.STRING },
                fxPlugins: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      deepDive: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            parameter: { type: Type.STRING },
                            value: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                          },
                          required: ["parameter", "value", "explanation"]
                        }
                      }
                    },
                    required: ["name", "purpose", "deepDive"]
                  }
                }
              },
              required: ["name", "sourceSoundGoal", "fxPlugins"]
            }
          },
          layeringStrategy: { type: Type.STRING }
        },
        required: ["vocalTracks", "layeringStrategy"]
      },
      vocalElements: {
        type: Type.OBJECT,
        properties: {
          trackingChain: {
            type: Type.OBJECT,
            properties: {
              unisonPlugin: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  deepDive: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        parameter: { type: Type.STRING },
                        value: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ["parameter", "value", "explanation"]
                    }
                  }
                },
                required: ["name", "purpose", "deepDive"]
              },
              inserts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                    deepDive: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          parameter: { type: Type.STRING },
                          value: { type: Type.STRING },
                          explanation: { type: Type.STRING }
                        },
                        required: ["parameter", "value", "explanation"]
                      }
                    }
                  },
                  required: ["name", "purpose", "deepDive"]
                }
              },
              dspUsageNote: { type: Type.STRING }
            },
            required: ["inserts"]
          },
          vocalTracks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sourceSoundGoal: { type: Type.STRING },
                busSend: { type: Type.STRING },
                loopGuide: { type: Type.STRING },
                fxPlugins: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      deepDive: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            parameter: { type: Type.STRING },
                            value: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                          },
                          required: ["parameter", "value", "explanation"]
                        }
                      }
                    },
                    required: ["name", "purpose", "deepDive"]
                  }
                }
              },
              required: ["name", "sourceSoundGoal", "fxPlugins"]
            }
          },
          layeringStrategy: { type: Type.STRING }
        },
        required: ["vocalTracks", "layeringStrategy"]
      }
    },
    required: ["title", "style", "bpm", "description", "artistTypes", "instruments", "busses", "drumPatterns", "arrangement", "masterPlugins"]
  };
};


// COMMON_PLUGIN_MAPPING is now dynamically imported in enrichPluginLibrary

export const enrichPluginLibrary = async (
  plugins: VSTPlugin[],
  onProgress: (progress: number, estimatedTimeLeft: number) => void,
  onStatus?: (status: string) => void,
  thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH
): Promise<VSTPlugin[]> => {
  // Dynamic import for the large mapping
  const { COMMON_PLUGIN_MAPPING } = await import('../constants/pluginMapping');

  let processedCount = 0;
  const startTime = Date.now();
  const sysM = localStorage.getItem('sys_m_v') === 'true';
  let tier = (localStorage.getItem('bg_api_tier') as 'TIER_1' | 'FREE') || 'FREE';
  
  if (sysM) {
    tier = 'TIER_1';
  }
  
  // Optimization Strategy:
  // TIER_1: High concurrency, larger batches. Fast.
  // FREE: Low concurrency (sequential), smaller batches. Higher quality/reliability.
  const BATCH_SIZE = tier === 'TIER_1' ? 25 : 15; 
  const CONCURRENCY = tier === 'TIER_1' ? 5 : 2; 
  const MAX_RETRIES = 3;

  if (onStatus) onStatus(`Starting research with ${tier} strategy...`);
  console.log(`Enriching library with ${tier} strategy. Batch Size: ${BATCH_SIZE}, Concurrency: ${CONCURRENCY}`);

  const updateProgress = (count: number) => {
    processedCount += count;
    const progress = Math.round((processedCount / plugins.length) * 100);
    const elapsedTime = Date.now() - startTime;
    const rate = processedCount > 0 ? elapsedTime / processedCount : 0;
    const remainingPlugins = plugins.length - processedCount;
    const estimatedTimeLeft = Math.round((remainingPlugins * rate) / 1000);
    onProgress(progress, estimatedTimeLeft);
    if (onStatus) onStatus(`Analyzed ${processedCount} of ${plugins.length} plugins...`);
  };

  const processBatch = async (batch: VSTPlugin[], retryCount = 0): Promise<VSTPlugin[]> => {
    // Pre-check for common plugins to save API calls and guarantee accuracy
    const preMappedBatch = batch.map(p => {
      const lowerName = p.name.toLowerCase();
      const lowerVendor = p.vendor.toLowerCase();
      
      for (const [key, mapping] of Object.entries(COMMON_PLUGIN_MAPPING)) {
        if (lowerName.includes(key) || lowerVendor.includes(key)) {
          return {
            ...p,
            type: mapping.type,
            description: mapping.description,
            features: ["Pre-verified high-quality mapping"],
            isPreMapped: true
          };
        }
      }
      return p;
    });

    const pluginsToResearch = preMappedBatch.filter(p => !(p as any).isPreMapped);
    
    if (pluginsToResearch.length === 0) {
      return preMappedBatch;
    }

    // Use Gemini Flash for high-volume plugin research to balance cost and accuracy
    const ai = getAI();
    const pluginList = pluginsToResearch.map((p, i) => `${i + 1}. ${p.vendor} - ${p.name} ${p.version !== 'N/A' ? `(v${p.version})` : ''}`).join('\n');
    
    const prompt = `
      You are a world-class VST plugin expert and audio engineer. 
      I have a list of ${batch.length} audio plugins (VST/AU/AAX).
      
      For EACH plugin in the list below, provide a detailed description, key features, and the most accurate category.
      
      PLUGINS TO ANALYZE:
      ${pluginList}

      CATEGORIZATION RULES:
      - 'Instruments': Synths, Samplers, Drum Machines, Kontakt Libraries, Romplers. (e.g., Serum, Omnisphere, Kontakt, Sylenth1, Nexus)
      - 'Dynamics': Compressors, Limiters, Gates, De-essers, Expanders. (e.g., CLA-76, Pro-C 2, L2 Limiter, OTT)
      - 'Equalizers': EQs, Dynamic EQs, Tone Shapers. (e.g., Pro-Q 3, SSL Channel, PuigTec)
      - 'Reverb & Delay': Reverbs, Delays, Echoes, Spacial Processors. (e.g., ValhallaVintageVerb, EchoBoy, H-Delay)
      - 'Modulation': Chorus, Flanger, Phaser, Tremolo, Vibrato. (e.g., MicroShift, MetaFlanger, Brauer Motion)
      - 'Distortion & Saturation': Overdrive, Fuzz, Bitcrushers, Tape/Tube Emulations, Exciter. (e.g., Decapitator, Saturn 2, Trash 2)
      - 'Utility & Metering': Tuners, Analyzers, Gain Staging, Phase Tools. (e.g., Span, Insight, Metric AB)
      - 'Creative FX': Granular, Glitch, Pitch Shifters (like Little AlterBoy), Multi-FX (like RC-20), or anything that doesn't fit above.

      CRITICAL:
      1. Do NOT categorize everything as 'Creative FX'. This is a sign of failure.
      2. If a plugin is a well-known instrument, it MUST be 'Instruments'.
      3. If a plugin is a well-known compressor, it MUST be 'Dynamics'.
      4. For each plugin, first explain your reasoning for the category choice.
      5. Provide a professional, helpful description for each.
      6. Return the results in the EXACT order of the list provided.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Use standard Flash for high-volume research
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plugins: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    reasoning: { type: Type.STRING, description: "Why this category was chosen" },
                    description: { type: Type.STRING },
                    features: { type: Type.ARRAY, items: { type: Type.STRING } },
                    category: { type: Type.STRING, enum: ['Instruments', 'Dynamics', 'Equalizers', 'Reverb & Delay', 'Modulation', 'Distortion & Saturation', 'Utility & Metering', 'Creative FX'] }
                  },
                  required: ["reasoning", "description", "features", "category"]
                }
              }
            }
          }
        }
      });

      const text = response.text?.trim() || '{"plugins": []}';
      const result = JSON.parse(text);
      const researchResults: VSTPlugin[] = [];

      if (result.plugins && Array.isArray(result.plugins)) {
        pluginsToResearch.forEach((plugin, index) => {
          const details = result.plugins[index];
          if (details) {
            researchResults.push({
              ...plugin,
              description: details.description || "A professional audio plugin.",
              features: details.features || [],
              type: details.category || "Creative FX"
            });
          } else {
            researchResults.push({
              ...plugin,
              description: "A professional audio plugin.",
              features: ["Standard processing"],
              type: "Creative FX"
            });
          }
        });
      } else {
        throw new Error("Invalid AI response format");
      }

      // Merge pre-mapped and researched results back in order
      let researchIdx = 0;
      return preMappedBatch.map(p => {
        if ((p as any).isPreMapped) {
          const { isPreMapped, ...rest } = p as any;
          return rest;
        }
        return researchResults[researchIdx++];
      });

    } catch (error: any) {
      console.error(`Batch enrichment attempt ${retryCount + 1} failed:`, error);
      
      const errorStr = JSON.stringify(error).toLowerCase();
      const isAuthError = errorStr.includes("401") || errorStr.includes("403") || errorStr.includes("api key not valid");
      
      if (isAuthError) {
        throw error;
      }

      if (retryCount < MAX_RETRIES) {
        // Exponential backoff: 3s, 6s, 12s
        const delay = Math.pow(2, retryCount) * 3000;
        console.log(`Retrying batch in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return processBatch(batch, retryCount + 1);
      }
      
      // Final fallback - mark as failed so we can detect it
      return batch.map(p => ({
        ...p,
        description: "Could not analyze due to API limits or connection issues.",
        features: ["Standard processing"],
        type: "Creative FX"
      }));
    }
  };

  // Chunk the plugins
  const chunks: VSTPlugin[][] = [];
  for (let i = 0; i < plugins.length; i += BATCH_SIZE) {
    chunks.push(plugins.slice(i, i + BATCH_SIZE));
  }

  const enrichedPlugins: VSTPlugin[] = [];
  
  // Process chunks with concurrency
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const activeChunks = chunks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(activeChunks.map(chunk => processBatch(chunk)));
    
    results.forEach(batchResult => {
      enrichedPlugins.push(...batchResult);
      updateProgress(batchResult.length);
    });
    
    // Safety delay to respect rate limits (especially for Free Tier)
    if (tier === 'FREE') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Final check: if more than 80% of plugins failed to analyze, throw an error
  const failedCount = enrichedPlugins.filter(p => p.description?.includes("Could not analyze")).length;
  if (failedCount > plugins.length * 0.8 && plugins.length > 5) {
    throw new Error("RESEARCH_FAILED: The AI research process failed for most of your plugins. This is usually due to API rate limits. Please try again in a few minutes or use a smaller list.");
  }

  return enrichedPlugins;
};

export const getBeatRecommendations = async (plugins: VSTPlugin[], analogInstruments: string[] = [], analogHardware: string[] = [], drumKits: Hardware[] = [], excludeAnalog: boolean = false, dawType: string | null = null, starredPlugins: string[] = [], isGangstaVox: boolean = false, thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH): Promise<RecommendationResponse> => {
  const ai = getAI();
  const pluginListStr = plugins.map(p => `${p.vendor} - ${p.name} (${p.type})`).join('\n');
  const analogStr = !excludeAnalog ? generateAnalogStr(analogInstruments, analogHardware, drumKits) : '';
  const dawStr = dawType ? `\nThe user is using ${dawType} as their DAW. Include specific instructions or tips for ${dawType} where relevant in the guides or recipes.` : '';
  const starredStr = starredPlugins.length > 0 ? `\nCRITICAL: The user has STARRED (favorited) the following plugins. You MUST prioritize using these plugins in your recipes whenever possible:\n${starredPlugins.join(', ')}` : '';
  
  const hasSphereMic = analogHardware.some(h => ['Sphere DLX', 'Sphere LX', 'L22'].includes(h));
  const sphereMicStr = hasSphereMic ? `\nCRITICAL: The user owns a Universal Audio Sphere (DLX/LX) or Townsend Labs L22 microphone. If the recipe involves vocals or acoustic instruments, you MUST recommend using the 'UAD Sphere Mic Collection', 'Ocean Way Mic Collection', or 'Bill Putnam Mic Collection' plugins. For these plugins, specify the EXACT 'Mic Model' (e.g., LD-47K, LD-67, OW-47, BP-251E) and other relevant parameters (Pattern, Filter, Proximity, Axis) to achieve the desired sound character.` : '';

  const prompt = isGangstaVox ? `
    Analyze my VST plugin list and suggest 1 high-level, extremely detailed "Vocal FX Chain Recipe" for the craziest vocal mix.
    Only use plugins from this list:
    ${pluginListStr}
    ${analogStr}
    ${dawStr}
    ${starredStr}
    ${sphereMicStr}

    Focus on modern vocal sub-genres: Melodic Trap, Dark Drill, High-Energy Rage, Ethereal Cloud Rap.
    Identify 2-3 mainstream or commonly known artists who would typically use this specific vocal chain (e.g., "Travis Scott type", "Playboi Carti type").
    Include a recommended BPM, 'recommendedScale', and 'chordProgression' that fits the vibe.
    
    You MUST provide the 'gangstaVox' object in your response.
    - trackingChain: Include the unisonPlugin (if applicable) and up to 4 inserts. Provide a deep dive for each (AT LEAST 10 parameters per plugin).
    - vocalTracks: Provide multiple vocal layers (Lead, Adlibs, Doubles, etc.). For each, describe the sourceSoundGoal, which bus to send to (busSend), and the fxPlugins (with deep dives - AT LEAST 8 parameters per plugin).
    - layeringStrategy: Explain how all these vocal layers should sit together in the mix.

    You MUST also provide the 'busses' array. Create busses (e.g., "Vocal Reverb Bus", "Delay Bus") and list which vocal tracks are using them, along with the fxPlugins on the bus and their deep dives (AT LEAST 8 parameters per plugin).
    
    You MUST provide the 'masterPlugins' array with deep dives for the master chain (AT LEAST 10 parameters per plugin).
    You MUST provide 'drumPatterns' and 'arrangement' as context for the beat.

    CRITICAL DRUM PATTERN RULES:
    - You MUST provide a FULL drum pattern for Kick, Snare, and Hi-Hat.
    - 'isDoubleTime' should ONLY be true when appropriate for the genre or section (e.g., fast 32nd note hi-hat rolls in Trap, or double-time kicks in certain Rage beats).
    - By default, most instruments should have 'isDoubleTime' set to false (16 steps).
    - If 'isDoubleTime' is true, provide steps ranging from 1 to 32.
    - If 'isDoubleTime' is false, provide steps ranging from 1 to 16.
    - Ensure the 'steps' array reflects the correct length based on 'isDoubleTime'.
  ` : `
    Analyze my VST plugin list and suggest 1 high-level, extremely detailed "Beat Recipe" for the craziest rap beat.
    Only use plugins from this list:
    ${pluginListStr}
    ${analogStr}
    ${dawStr}
    ${starredStr}
    ${sphereMicStr}

    Focus on modern sub-genres: Melodic Trap, Dark Drill, High-Energy Rage.
    Identify 2-3 mainstream or commonly known artists who would typically use this specific beat type (e.g., "Lil Wayne type", "Travis Scott type").
    Include a recommended BPM, 'recommendedScale', and 'chordProgression'.
    
    You MUST provide the 'instruments' array with AT LEAST 3 DISTINCT "REAL" instruments (e.g., synths, pianos, guitars, strings). 
    CRITICAL: DO NOT use vocals as a main instrument in the 'instruments' array. Vocals MUST be separate.
    For each instrument:
    - Provide the exact plugin name to use in the 'plugin' field.
    - Provide a deep dive on the instrument itself (e.g., oscillator settings, macro tweaks, filter envelopes). Provide AT LEAST 10 parameter settings in the 'deepDive' array.
    - Provide an array of fxPlugins (up to 6) with a deep dive for EACH plugin. Provide AT LEAST 8 parameter settings for each FX plugin.
    - Specify which bus to send to (busSend).
    - Provide a detailed MIDI pattern for this instrument in the 'midiNotes' array, tailored specifically to the tempo (BPM) and style of this beat. Ensure the MIDI pattern is unique and creative for this specific recipe. Use synth-based sounds for all instruments, characteristic of modern rap production.
      Each note in the array MUST have:
      - pitch: (e.g., 'C4')
      - duration: (e.g., '4', '8', '16')
      - wait: (e.g., '0', '4', '8')
      - velocity: (number between 0 and 127)
    
    If vocals are used in the beat (e.g., vocal chops, atmospheric textures), you MUST provide the 'vocalElements' object (same structure as gangstaVox) to describe them. This is the ONLY place vocal elements should be described.
    
    You MUST provide the 'busses' array. Create busses (e.g., "Drum Bus", "Melody Bus") and list which instrument tracks are using them, along with the fxPlugins on the bus and their deep dives (AT LEAST 8 parameters per plugin).
    
    You MUST provide the 'masterPlugins' array with deep dives for the master chain (AT LEAST 10 parameters per plugin).
    You MUST provide 'drumPatterns' and 'arrangement'.

    CRITICAL DRUM PATTERN RULES:
    - You MUST provide a FULL drum pattern for Kick, Snare, and Hi-Hat.
    - If 'isDoubleTime' is true for any drum part (kick, snare, hiHat), you MUST provide steps ranging from 1 to 32.
    - If 'isDoubleTime' is false, provide steps ranging from 1 to 16.
    - Ensure the 'steps' array reflects the full length (32 steps if double time, 16 if not).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipes: {
            type: Type.ARRAY,
            items: getUnifiedRecipeSchema()
          }
        },
        required: ["recipes"]
      }
    }
  });

  const jsonStr = response.text?.trim() || '{"recipes": []}';
  const result = JSON.parse(jsonStr);
  
  if (isGangstaVox && result.recipes) {
    result.recipes = result.recipes.map((r: any) => ({ ...r, isGangstaVox: true }));
  }
  
  return result;
};

export const getCustomBeatRecommendations = async (plugins: VSTPlugin[], query: string, analogInstruments: string[] = [], analogHardware: string[] = [], drumKits: Hardware[] = [], excludeAnalog: boolean = false, dawType: string | null = null, starredPlugins: string[] = [], isGangstaVox: boolean = false, thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH): Promise<RecommendationResponse> => {
  const ai = getAI();
  const pluginListStr = plugins.map(p => `${p.vendor} - ${p.name} (${p.type})`).join('\n');
  const analogStr = !excludeAnalog ? generateAnalogStr(analogInstruments, analogHardware, drumKits) : '';
  const dawStr = dawType ? `\nThe user is using ${dawType} as their DAW. Include specific instructions or tips for ${dawType} where relevant in the guides or recipes.` : '';
  const starredStr = starredPlugins.length > 0 ? `\nCRITICAL: The user has STARRED (favorited) the following plugins. You MUST prioritize using these plugins in your recipes whenever possible:\n${starredPlugins.join(', ')}` : '';

  const hasSphereMic = analogHardware.some(h => ['Sphere DLX', 'Sphere LX', 'L22'].includes(h));
  const sphereMicStr = hasSphereMic ? `\nCRITICAL: The user owns a Universal Audio Sphere (DLX/LX) or Townsend Labs L22 microphone. If the recipe involves vocals or acoustic instruments, you MUST recommend using the 'UAD Sphere Mic Collection', 'Ocean Way Mic Collection', or 'Bill Putnam Mic Collection' plugins. For these plugins, specify the EXACT 'Mic Model' (e.g., LD-47K, LD-67, OW-47, BP-251E) and other relevant parameters (Pattern, Filter, Proximity, Axis) to achieve the desired sound character.` : '';

  const isMarkRuhedra = query.toLowerCase().includes("mark ruhedra");
  const ruhedraStyle = isMarkRuhedra ? `
    CRITICAL STYLE GUIDE: The user is searching for the "Mark Ruhedra" vibe.
    You MUST emulate his signature production style:
    - Signature Sound: Polished, modern, hard-hitting trap/rap with crisp, clear vocals and wide, atmospheric melodies.
    - Key Plugin Chain: Prioritize using his favorite plugins:
      - Dynamics/Compression: Waves Silk Vocal, Waves H-Comp, IK Multimedia T-RackS 6 (VComp, Bus Compressor).
      - Saturation/Color: Waves Magma Lil Tube, Arturia Tape MELLO-FI, BABY Audio Beat Slammer.
      - EQ: Waves VEQ4, IK T-RackS 6 (EQ-81, EQ-73).
      - Vocal Polish: iZotope Nectar 3 Elements, iZotope Ozone 9 Elements.
      - Creative FX: Soundtoys PhaseMistress, Little PrimalTap, BABY Audio Warp.
    - Mixing Techniques: Use parallel compression, heavy saturation on drums and bass, and precise subtractive EQ on vocals to keep them crisp.
  ` : '';

  const prompt = isGangstaVox ? `
    Analyze my VST plugin list and suggest 1 high-level, extremely detailed "Vocal FX Chain Recipe" specifically for a "${query} type vocal".
    Only use plugins from this list:
    ${pluginListStr}
    ${analogStr}
    ${dawStr}
    ${starredStr}
    ${sphereMicStr}
    ${ruhedraStyle}

    Ensure the recipe captures the signature vocal sound, effects, and mixing techniques associated with ${query}.
    Identify 2-3 mainstream or commonly known artists who would typically use this specific vocal chain.
    Include a recommended BPM, 'recommendedScale', and 'chordProgression' that fits the vibe.

    You MUST provide the 'gangstaVox' object in your response.
    - trackingChain: Include the unisonPlugin (if applicable) and up to 4 inserts. Provide a deep dive for each (AT LEAST 10 parameters per plugin).
    - vocalTracks: Provide multiple vocal layers (Lead, Adlibs, Doubles, etc.). For each, describe the sourceSoundGoal, which bus to send to (busSend), and the fxPlugins (with deep dives - AT LEAST 8 parameters per plugin).
    - layeringStrategy: Explain how all these vocal layers should sit together in the mix.

    You MUST also provide the 'busses' array. Create busses (e.g., "Vocal Reverb Bus", "Delay Bus") and list which vocal tracks are using them, along with the fxPlugins on the bus and their deep dives (AT LEAST 8 parameters per plugin).
    
    You MUST provide the 'masterPlugins' array with deep dives for the master chain (AT LEAST 10 parameters per plugin).
    You MUST provide 'drumPatterns' and 'arrangement' as context for the beat.

    CRITICAL DRUM PATTERN RULES:
    - You MUST provide a FULL drum pattern for Kick, Snare, and Hi-Hat.
    - 'isDoubleTime' should ONLY be true when appropriate for the genre or section (e.g., fast 32nd note hi-hat rolls in Trap, or double-time kicks in certain Rage beats).
    - By default, most instruments should have 'isDoubleTime' set to false (16 steps).
    - If 'isDoubleTime' is true, provide steps ranging from 1 to 32.
    - If 'isDoubleTime' is false, provide steps ranging from 1 to 16.
    - Ensure the 'steps' array reflects the correct length based on 'isDoubleTime'.
  ` : `
    Analyze my VST plugin list and suggest 1 high-level, extremely detailed "Beat Recipe" specifically for a "\${query} type beat".
    Only use plugins from this list:
    ${pluginListStr}
    ${analogStr}
    ${dawStr}
    ${starredStr}
    ${sphereMicStr}

    Ensure the recipe captures the signature sound, bounce, and atmospheric elements associated with ${query}.
    Identify 2-3 mainstream or commonly known artists who would typically use this specific beat type.
    Include a recommended BPM, 'recommendedScale', and 'chordProgression' that fits the vibe.

    You MUST provide the 'instruments' array with AT LEAST 3 DISTINCT "REAL" instruments (e.g., synths, pianos, guitars, strings). 
    CRITICAL: DO NOT use vocals as a main instrument in the 'instruments' array. Vocals MUST be separate.
    For each instrument:
    - Provide the exact plugin name to use in the 'plugin' field.
    - Provide a deep dive on the instrument itself (e.g., oscillator settings, macro tweaks, filter envelopes). Provide AT LEAST 10 parameter settings in the 'deepDive' array.
    - Provide an array of fxPlugins (up to 6) with a deep dive for EACH plugin. Provide AT LEAST 8 parameter settings for each FX plugin.
    - Specify which bus to send to (busSend).
    - Provide a detailed MIDI pattern for this instrument in the 'midiNotes' array, tailored specifically to the tempo (BPM) and style of this beat. Ensure the MIDI pattern is unique and creative for this specific recipe. Use synth-based sounds for all instruments, characteristic of modern rap production.
      Each note in the array MUST have:
      - pitch: (e.g., 'C4')
      - duration: (e.g., '4', '8', '16')
      - wait: (e.g., '0', '4', '8')
      - velocity: (number between 0 and 127)
    
    If vocals are used in the beat (e.g., vocal chops, atmospheric textures), you MUST provide the 'vocalElements' object (same structure as gangstaVox) to describe them. This is the ONLY place vocal elements should be described.
    
    You MUST provide the 'busses' array. Create busses (e.g., "Drum Bus", "Melody Bus") and list which instrument tracks are using them, along with the fxPlugins on the bus and their deep dives (AT LEAST 8 parameters per plugin).
    
    You MUST provide the 'masterPlugins' array with deep dives for the master chain (AT LEAST 10 parameters per plugin).
    You MUST provide 'drumPatterns' and 'arrangement'.

    CRITICAL DRUM PATTERN RULES:
    - You MUST provide a FULL drum pattern for Kick, Snare, and Hi-Hat.
    - If 'isDoubleTime' is true for any drum part (kick, snare, hiHat), you MUST provide steps ranging from 1 to 32.
    - If 'isDoubleTime' is false, provide steps ranging from 1 to 16.
    - Ensure the 'steps' array reflects the full length (32 steps if double time, 16 if not).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipes: {
            type: Type.ARRAY,
            items: getUnifiedRecipeSchema()
          }
        },
        required: ["recipes"]
      }
    }
  });

  const jsonStr = response.text?.trim() || '{"recipes": []}';
  const result = JSON.parse(jsonStr);
  
  if (isGangstaVox && result.recipes) {
    result.recipes = result.recipes.map((r: any) => ({ ...r, isGangstaVox: true }));
  }
  
  return result;
};

export const getSongBeatRecommendations = async (plugins: VSTPlugin[], songQuery: string, analogInstruments: string[] = [], analogHardware: string[] = [], drumKits: Hardware[] = [], excludeAnalog: boolean = false, dawType: string | null = null, starredPlugins: string[] = [], isGangstaVox: boolean = false, thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH): Promise<RecommendationResponse> => {
  const ai = getAI();
  const pluginListStr = plugins.map(p => `${p.vendor} - ${p.name} (${p.type})`).join('\n');
  const analogStr = !excludeAnalog ? generateAnalogStr(analogInstruments, analogHardware, drumKits) : '';
  const dawStr = dawType ? `\nThe user is using ${dawType} as their DAW. Include specific instructions or tips for ${dawType} where relevant in the guides or recipes.` : '';
  const starredStr = starredPlugins.length > 0 ? `\nCRITICAL: The user has STARRED (favorited) the following plugins. You MUST prioritize using these plugins in your recipes whenever possible:\n${starredPlugins.join(', ')}` : '';

  const hasSphereMic = analogHardware.some(h => ['Sphere DLX', 'Sphere LX', 'L22'].includes(h));
  const sphereMicStr = hasSphereMic ? `\nCRITICAL: The user owns a Universal Audio Sphere (DLX/LX) or Townsend Labs L22 microphone. If the recipe involves vocals or acoustic instruments, you MUST recommend using the 'UAD Sphere Mic Collection', 'Ocean Way Mic Collection', or 'Bill Putnam Mic Collection' plugins. For these plugins, specify the EXACT 'Mic Model' (e.g., LD-47K, LD-67, OW-47, BP-251E) and other relevant parameters (Pattern, Filter, Proximity, Axis) to achieve the desired sound character.` : '';

  const prompt = isGangstaVox ? `
    Analyze my VST plugin list and suggest 1 high-level, extremely detailed "Vocal FX Chain Recipe" that recreate the vocal production style, effects, and mixing techniques of the song "${songQuery}".
    Only use plugins from this list:
    ${pluginListStr}
    ${analogStr}
    ${dawStr}
    ${starredStr}
    ${sphereMicStr}

    Ensure the recipe captures the signature vocal sound of that specific song.
    Identify 2-3 mainstream or commonly known artists who would typically use this specific vocal chain.
    Include a recommended BPM, 'recommendedScale', and 'chordProgression' that fits the vibe.

    You MUST provide the 'gangstaVox' object in your response.
    - trackingChain: Include the unisonPlugin (if applicable) and up to 4 inserts. Provide a deep dive for each (AT LEAST 10 parameters per plugin).
    - vocalTracks: Provide multiple vocal layers (Lead, Adlibs, Doubles, etc.). For each, describe the sourceSoundGoal, which bus to send to (busSend), and the fxPlugins (with deep dives - AT LEAST 8 parameters per plugin).
    - layeringStrategy: Explain how all these vocal layers should sit together in the mix.

    You MUST also provide the 'busses' array. Create busses (e.g., "Vocal Reverb Bus", "Delay Bus") and list which vocal tracks are using them, along with the fxPlugins on the bus and their deep dives (AT LEAST 8 parameters per plugin).
    
    You MUST provide the 'masterPlugins' array with deep dives for the master chain (AT LEAST 10 parameters per plugin).
    You MUST provide 'drumPatterns' and 'arrangement' as context for the beat.

    CRITICAL DRUM PATTERN RULES:
    - You MUST provide a FULL drum pattern for Kick, Snare, and Hi-Hat.
    - 'isDoubleTime' should ONLY be true when appropriate for the genre or section (e.g., fast 32nd note hi-hat rolls in Trap, or double-time kicks in certain Rage beats).
    - By default, most instruments should have 'isDoubleTime' set to false (16 steps).
    - If 'isDoubleTime' is true, provide steps ranging from 1 to 32.
    - If 'isDoubleTime' is false, provide steps ranging from 1 to 16.
    - Ensure the 'steps' array reflects the correct length based on 'isDoubleTime'.
  ` : `
    Analyze my VST plugin list and suggest 1 high-level, extremely detailed "Beat Recipe" that recreate the production style, bounce, and sonic atmosphere of the song "\${songQuery}".
    Only use plugins from this list:
    ${pluginListStr}
    ${analogStr}
    ${dawStr}
    ${starredStr}
    ${sphereMicStr}

    Ensure the recipe captures the signature sound, instrumentation, and mixing techniques of that specific song.
    Identify 2-3 mainstream or commonly known artists who would typically use this specific beat type.
    Include a recommended BPM, 'recommendedScale', and 'chordProgression' that fits the vibe.

    You MUST provide the 'instruments' array with AT LEAST 3 DISTINCT "REAL" instruments (e.g., synths, pianos, guitars, strings). 
    CRITICAL: DO NOT use vocals as a main instrument in the 'instruments' array. Vocals MUST be separate.
    For each instrument:
    - Provide the exact plugin name to use in the 'plugin' field.
    - Provide a deep dive on the instrument itself (e.g., oscillator settings, macro tweaks, filter envelopes). Provide AT LEAST 10 parameter settings in the 'deepDive' array.
    - Provide an array of fxPlugins (up to 6) with a deep dive for EACH plugin. Provide AT LEAST 8 parameter settings for each FX plugin.
    - Specify which bus to send to (busSend).
    - Provide a detailed MIDI pattern for this instrument in the 'midiNotes' array, tailored specifically to the tempo (BPM) and style of this beat. Ensure the MIDI pattern is unique and creative for this specific recipe. Use synth-based sounds for all instruments, characteristic of modern rap production.
      Each note in the array MUST have:
      - pitch: (e.g., 'C4')
      - duration: (e.g., '4', '8', '16')
      - wait: (e.g., '0', '4', '8')
      - velocity: (number between 0 and 127)
    
    If vocals are used in the beat (e.g., vocal chops, atmospheric textures), you MUST provide the 'vocalElements' object (same structure as gangstaVox) to describe them. This is the ONLY place vocal elements should be described.
    
    You MUST provide the 'busses' array. Create busses (e.g., "Drum Bus", "Melody Bus") and list which instrument tracks are using them, along with the fxPlugins on the bus and their deep dives (AT LEAST 8 parameters per plugin).
    
    You MUST provide the 'masterPlugins' array with deep dives for the master chain (AT LEAST 10 parameters per plugin).
    You MUST provide 'drumPatterns' and 'arrangement'.

    CRITICAL DRUM PATTERN RULES:
    - You MUST provide a FULL drum pattern for Kick, Snare, and Hi-Hat.
    - If 'isDoubleTime' is true for any drum part (kick, snare, hiHat), you MUST provide steps ranging from 1 to 32.
    - If 'isDoubleTime' is false, provide steps ranging from 1 to 16.
    - Ensure the 'steps' array reflects the full length (32 steps if double time, 16 if not).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipes: {
            type: Type.ARRAY,
            items: getUnifiedRecipeSchema()
          }
        },
        required: ["recipes"]
      }
    }
  });

  const jsonStr = response.text?.trim() || '{"recipes": []}';
  const result = JSON.parse(jsonStr);
  
  if (isGangstaVox && result.recipes) {
    result.recipes = result.recipes.map((r: any) => ({ ...r, isGangstaVox: true }));
  }
  
  return result;
};

export const generateContentViaBackend = async (model: string, prompt: string, config: any, _turnstileToken?: string | null, _sessionId?: string | null) => {
  const ai = getAI();
  return await ai.models.generateContent({
    model,
    contents: prompt,
    config
  });
};

export const getAudioBeatRecommendations = async (plugins: VSTPlugin[], audioBase64: string, mimeType: string, analogInstruments: string[] = [], analogHardware: string[] = [], drumKits: Hardware[] = [], excludeAnalog: boolean = false, dawType: string | null = null, starredPlugins: string[] = [], isGangstaVox: boolean = false, thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH): Promise<RecommendationResponse> => {
  const ai = getAI();
  
  // Limit plugin list to 50 most relevant to avoid context/complexity limits
  const limitedPlugins = plugins.slice(0, 50);
  const pluginListStr = limitedPlugins.map(p => `${p.vendor} - ${p.name} (${p.type})`).join('\n');
  
  const analogStr = !excludeAnalog ? generateAnalogStr(analogInstruments, analogHardware, drumKits) : '';
  const dawStr = dawType ? `\nThe user is using ${dawType} as their DAW. Include specific instructions or tips for ${dawType} where relevant in the guides or recipes.` : '';
  const starredStr = starredPlugins.length > 0 ? `\nCRITICAL: The user has STARRED (favorited) the following plugins. You MUST prioritize using these plugins in your recipes whenever possible:\n${starredPlugins.join(', ')}` : '';

  const prompt = isGangstaVox ? `
    Analyze the attached audio file and suggest 1 high-level, extremely detailed "Vocal FX Chain Recipe" that recreate the vocal production style, effects, and mixing techniques heard in the provided audio.
    Only use plugins from this list:
    ${pluginListStr}
    ${analogStr}
    ${dawStr}
    ${starredStr}

    Ensure the recipe captures the signature vocal sound of the audio.
    Identify 2-3 mainstream or commonly known artists who would typically use this specific vocal chain.
    Include a recommended BPM, 'recommendedScale', and 'chordProgression' that fits the vibe.

    You MUST provide the 'gangstaVox' object in your response.
    - trackingChain: Include the unisonPlugin (if applicable) and up to 4 inserts. Provide a deep dive for each (AT LEAST 10 parameters per plugin).
    - vocalTracks: Provide multiple vocal layers (Lead, Adlibs, Doubles, etc.). For each, describe the sourceSoundGoal, which bus to send to (busSend), and the fxPlugins (with deep dives - AT LEAST 8 parameters per plugin).
    - layeringStrategy: Explain how all these vocal layers should sit together in the mix.

    You MUST also provide the 'busses' array. Create busses (e.g., "Vocal Reverb Bus", "Delay Bus") and list which vocal tracks are using them, along with the fxPlugins on the bus and their deep dives (AT LEAST 8 parameters per plugin).
    
    You MUST provide the 'masterPlugins' array with deep dives for the master chain (AT LEAST 10 parameters per plugin).
    You MUST provide 'drumPatterns' and 'arrangement' as context for the beat.

    CRITICAL DRUM PATTERN RULES:
    - You MUST provide a FULL drum pattern for Kick, Snare, and Hi-Hat.
    - 'isDoubleTime' should ONLY be true when appropriate for the genre or section (e.g., fast 32nd note hi-hat rolls in Trap, or double-time kicks in certain Rage beats).
    - By default, most instruments should have 'isDoubleTime' set to false (16 steps).
    - If 'isDoubleTime' is true, provide steps ranging from 1 to 32.
    - If 'isDoubleTime' is false, provide steps ranging from 1 to 16.
    - Ensure the 'steps' array reflects the correct length based on 'isDoubleTime'.
  ` : `
    Analyze the attached audio file and suggest 1 high-level, extremely detailed "Beat Recipe" that recreate the production style, bounce, and sonic atmosphere of the provided audio.
    Only use plugins from this list:
    ${pluginListStr}
    ${analogStr}
    ${dawStr}
    ${starredStr}

    Ensure the recipe captures the signature sound, instrumentation, and mixing techniques heard in the audio.
    Identify 2-3 mainstream or commonly known artists who would typically use this specific beat type.
    Include a recommended BPM, 'recommendedScale', and 'chordProgression' that fits the vibe.

    You MUST provide the 'instruments' array with AT LEAST 3 DISTINCT "REAL" instruments (e.g., synths, pianos, guitars, strings). 
    CRITICAL: DO NOT use vocals as a main instrument in the 'instruments' array. Vocals MUST be separate.
    For each instrument:
    - Provide the exact plugin name to use in the 'plugin' field.
    - Provide a deep dive on the instrument itself (e.g., oscillator settings, macro tweaks, filter envelopes). Provide AT LEAST 10 parameter settings in the 'deepDive' array.
    - Provide an array of fxPlugins (up to 6) with a deep dive for EACH plugin. Provide AT LEAST 8 parameter settings for each FX plugin.
    - Specify which bus to send to (busSend).
    - Provide a detailed MIDI pattern for this instrument in the 'midiNotes' array, tailored specifically to the tempo (BPM) and style of this beat. Ensure the MIDI pattern is unique and creative for this specific recipe. Use synth-based sounds for all instruments, characteristic of modern rap production.
      Each note in the array MUST have:
      - pitch: (e.g., 'C4')
      - duration: (e.g., '4', '8', '16')
      - wait: (e.g., '0', '4', '8')
      - velocity: (number between 0 and 127)
    
    If vocals are used in the beat (e.g., vocal chops, atmospheric textures), you MUST provide the 'vocalElements' object (same structure as gangstaVox) to describe them. This is the ONLY place vocal elements should be described.
    
    You MUST provide the 'busses' array. Create busses (e.g., "Drum Bus", "Melody Bus") and list which instrument tracks are using them, along with the fxPlugins on the bus and their deep dives (AT LEAST 6 parameters per plugin).
    
    You MUST provide the 'masterPlugins' array with deep dives for the master chain (AT LEAST 10 parameters per plugin).
    You MUST provide 'drumPatterns' and 'arrangement'.

    CRITICAL DRUM PATTERN RULES:
    - You MUST provide a FULL drum pattern for Kick, Snare, and Hi-Hat.
    - 'isDoubleTime' should ONLY be true when appropriate for the genre or section (e.g., fast 32nd note hi-hat rolls in Trap, or double-time kicks in certain Rage beats).
    - By default, most instruments should have 'isDoubleTime' set to false (16 steps).
    - If 'isDoubleTime' is true, provide steps ranging from 1 to 32.
    - If 'isDoubleTime' is false, provide steps ranging from 1 to 16.
    - Ensure the 'steps' array reflects the correct length based on 'isDoubleTime'.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data: audioBase64, mimeType: mimeType } }
      ]
    },
    config: {
      thinkingConfig: { thinkingLevel },
      responseMimeType: "application/json",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipes: {
            type: Type.ARRAY,
            items: getUnifiedRecipeSchema()
          }
        },
        required: ["recipes"]
      }
    }
  });

  const jsonStr = response.text?.trim() || '{"recipes": []}';
  console.log("Gemini response text (Beat):", jsonStr);
  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON parse error (Beat):", e);
    throw new Error("Failed to parse AI response");
  }
  console.log("Parsed result (Beat):", result);
  
  if (isGangstaVox && result.recipes) {
    result.recipes = result.recipes.map((r: any) => ({ ...r, isGangstaVox: true }));
  }
  
  return result;
};

export const getMixCritique = async (plugins: VSTPlugin[], audioBase64: string, mimeType: string, isGangstaVox: boolean = false, hasStems: boolean = false, thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH): Promise<any> => {
  const ai = getAI();
  const pluginListStr = plugins.map(p => `${p.vendor} - ${p.name} (${p.type})`).join('\n');

  let focusInstruction = "";
  if (isGangstaVox) {
    focusInstruction = "Focus specifically on the VOCALS in this mix. Analyze vocal consistency, presence, and processing across the entire song.";
  } else {
    if (hasStems) {
      focusInstruction = "Focus specifically on the BEAT/INSTRUMENTAL in this mix. The user HAS STEMS (individual instrument tracks). Provide advice on how to process individual elements (e.g., EQing the kick, compressing the snare, panning hi-hats, sidechaining) to improve the overall mix.";
    } else {
      focusInstruction = "Focus specifically on the BEAT/INSTRUMENTAL in this mix. The user ONLY HAS THIS MP3 (a single stereo file). Provide advice on mastering and stereo bus processing (e.g., dynamic EQ, mid-side processing, stem separation tools, overall EQ balance, limiting) to improve the sound without access to individual tracks.";
    }
  }

  const prompt = `
    You are an expert audio engineer and producer. I am uploading an MP3 of a full song project that needs work.
    ${focusInstruction}
    
    Analyze the audio and provide a detailed mix critique. Since this is a full song, consider the dynamic changes, song structure (intro, verse, chorus, etc.), and how the mix evolves.
    
    Only recommend plugins from this list:
    ${pluginListStr}

    Provide:
    - 'title': A short title for this critique.
    - 'overallFeedback': A paragraph summarizing the current state of the mix and the main areas for improvement.
    - 'strengths': An array of 2-3 things that sound good.
    - 'weaknesses': An array of 2-3 specific issues that need fixing.
    - 'actionPlan': An array of actionable steps to fix the issues. For each step, provide:
      - 'issue': The specific problem.
      - 'solution': How to fix it.
      - 'recommendedChain': An array of plugins from the user's list to use for this fix, with 'pluginName', 'purpose', and specific 'settings'.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data: audioBase64, mimeType: mimeType } }
      ]
    },
    config: {
      thinkingConfig: { thinkingLevel },
      responseMimeType: "application/json",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          overallFeedback: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                issue: { type: Type.STRING },
                solution: { type: Type.STRING },
                recommendedChain: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      pluginName: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      settings: { type: Type.STRING }
                    },
                    required: ["pluginName", "purpose", "settings"]
                  }
                }
              },
              required: ["issue", "solution", "recommendedChain"]
            }
          }
        },
        required: ["title", "overallFeedback", "strengths", "weaknesses", "actionPlan"]
      }
    }
  });

  const jsonStr = response.text?.trim() || '{}';
  const result = JSON.parse(jsonStr);
  result.id = crypto.randomUUID();
  result.isGangstaVox = isGangstaVox;
  result.audioBase64 = audioBase64;
  result.mimeType = mimeType;
  return result;
};

export const getSpecificMixHelp = async (plugins: VSTPlugin[], audioBase64: string | undefined, mimeType: string | undefined, query: string, isGangstaVox: boolean = false, recipeContext?: string, thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH): Promise<any> => {
  const ai = getAI();
  const pluginListStr = plugins.map(p => `${p.vendor} - ${p.name} (${p.type})`).join('\n');

  const prompt = `
    You are an expert audio engineer and producer. 
    ${audioBase64 ? "I am uploading an MP3 of a project that needs work." : "I am providing a recipe for a track."}
    ${isGangstaVox ? "Focus specifically on the VOCALS." : "Focus specifically on the BEAT/INSTRUMENTAL."}
    
    The user is asking for specific help with: "${query}"
    
    ${recipeContext ? `Here is the recipe context:\n${recipeContext}\n` : ""}
    
    ${audioBase64 ? "Analyze the audio focusing ONLY on this specific request, and provide targeted advice." : "Analyze the recipe details focusing ONLY on this specific request, and provide targeted advice."}
    
    Only recommend plugins from this list:
    ${pluginListStr}

    Provide:
    - 'query': The user's query ("${query}").
    - 'advice': Detailed advice on how to address this specific request.
    - 'recommendedChain': An array of plugins from the user's list to use for this fix, with 'pluginName', 'purpose', and specific 'settings'.
  `;

  const contents: any = {
    parts: [
      { text: prompt }
    ]
  };

  if (audioBase64 && mimeType) {
    contents.parts.push({ inlineData: { data: audioBase64, mimeType: mimeType } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents,
    config: {
      thinkingConfig: { thinkingLevel },
      responseMimeType: "application/json",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING },
          advice: { type: Type.STRING },
          recommendedChain: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pluginName: { type: Type.STRING },
                purpose: { type: Type.STRING },
                settings: { type: Type.STRING }
              },
              required: ["pluginName", "purpose", "settings"]
            }
          }
        },
        required: ["query", "advice", "recommendedChain"]
      }
    }
  });

  const jsonStr = response.text?.trim() || '{}';
  return JSON.parse(jsonStr);
};

export const getGangstaVoxRecipe = async (recipe: BeatRecipe, plugins: VSTPlugin[], analogHardware: Hardware[], thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH): Promise<any> => {
  // Use Gemini Pro for maximum accuracy on complex vocal chains and DSP logic
  const ai = getAI();
  const pluginListStr = plugins.map(p => `${p.vendor} - ${p.name} (${p.type})`).join('\n');
  
  const hasApollo = analogHardware.some(h => h.name.toLowerCase().includes('apollo'));
  const apolloModel = analogHardware.find(h => h.name.toLowerCase().includes('apollo'))?.name || '';

  const prompt = `
    Analyze the following Beat Recipe:
    Title: ${recipe.title}
    Style: ${recipe.style}
    BPM: ${recipe.bpm}
    Description: ${recipe.description}

    Provide a matching "GangstaVox" Vocal FX Chain Recipe that perfectly complements this beat.
    Only use plugins from this list:
    ${pluginListStr}

    ${hasApollo ? `
    CRITICAL: The user owns a Universal Audio Apollo interface (${apolloModel}).
    You MUST include a 'trackingChain' specifically for this Apollo.
    - The tracking chain can have a MAXIMUM of 4 UAD plugins.
    - The FIRST plugin MUST be a Unison-enabled preamp/channel strip (e.g., Neve 1073, API Vision, Manley Voxbox, Avalon VT-737, SSL E Series, UA 610-B, Century Tube Channel Strip).
    - Consider the DSP limits of the specific Apollo model:
      - Apollo Solo / Arrow (1 DSP Core): Very limited. Use max 1-2 lightweight UAD plugins (e.g., UA 610-B + LA-2A Legacy).
      - Apollo Twin Duo (2 DSP Cores): Moderate. Can handle a Unison pre + 1-2 compressors/EQs.
      - Apollo Twin Quad / x4 (4 DSP Cores): Good. Can handle a full 4-plugin chain (e.g., Neve 1073 + 1176 + LA-2A + Pultec).
      - Apollo x6 / x8 / x8p / x16 (6+ DSP Cores): High. Can handle any 4-plugin chain easily.
    - CRITICAL DSP LOGIC: ONLY UAD plugins (plugins running on the Apollo hardware) use the Apollo's DSP. UADx (native), Nectar, Waves, FabFilter, or ANY OTHER native plugins run on the computer's CPU, NOT the Apollo DSP. Do NOT say that UADx or Nectar or other native plugins cause heavy DSP usage on the Apollo.
    - If the DSP limit is reached for the tracking chain, use UADx (native) or other non-UAD plugins from the user's list for the rest of the mixing chain, as they use CPU instead of DSP.
    - Provide a 'dspUsageNote' explaining the DSP management for this specific Apollo model, ensuring you correctly distinguish between DSP (Apollo) and CPU (Native).
    ` : ''}

    For the main vocal mix (after tracking), provide:
    - 'vocalLayers': An array of vocal layers (e.g., Lead Vocal, Background Vocal, Adlibs, Doubles).
      - For each layer, describe the 'sourceSoundGoal' (recording style/performance).
      - Provide a 'loopGuide' (arrangement tip).
      - Provide a 'processing': An array of 8-12 plugins to create a complex, professional vocal chain. For each plugin, provide 'pluginName' and a detailed 'purpose' with specific parameters.
      - Provide 'vocalDives': Detailed parameters for the key plugins in this specific layer.
        - 'pluginName': The name of the plugin.
        - 'whyItWorks': Why this plugin is essential for this vocal layer.
        - 'settings': Array of {parameter, value} pairs.
        - 'proTip': A professional tip for this plugin on this vocal layer.
    - 'layeringStrategy': How the vocals sit together and in the beat.
    - 'mastering': A mastering chain for the final vocal+beat mix.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview", // Use Pro for critical creative/technical reasoning
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel },
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trackingChain: {
            type: Type.OBJECT,
            properties: {
              unisonPlugin: { type: Type.STRING },
              plugins: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pluginName: { type: Type.STRING },
                    purpose: { type: Type.STRING }
                  },
                  required: ["pluginName", "purpose"]
                }
              },
              dspUsageNote: { type: Type.STRING }
            },
            required: ["plugins", "dspUsageNote"]
          },
          vocalLayers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                layerName: { type: Type.STRING },
                sourceSoundGoal: { type: Type.STRING },
                loopGuide: { type: Type.STRING },
                processing: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      pluginName: { type: Type.STRING },
                      purpose: { type: Type.STRING }
                    },
                    required: ["pluginName", "purpose"]
                  }
                },
                vocalDives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      pluginName: { type: Type.STRING },
                      whyItWorks: { type: Type.STRING },
                      settings: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            parameter: { type: Type.STRING },
                            value: { type: Type.STRING }
                          },
                          required: ["parameter", "value"]
                        }
                      },
                      proTip: { type: Type.STRING }
                    },
                    required: ["pluginName", "whyItWorks", "settings", "proTip"]
                  }
                }
              },
              required: ["layerName", "sourceSoundGoal", "loopGuide", "processing", "vocalDives"]
            }
          },
          layeringStrategy: { type: Type.STRING },
          mastering: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pluginName: { type: Type.STRING },
                purpose: { type: Type.STRING }
              },
              required: ["pluginName", "purpose"]
            }
          }
        },
        required: ["vocalLayers", "layeringStrategy", "mastering"]
      }
    }
  });

  const jsonStr = response.text?.trim() || '{}';
  return JSON.parse(jsonStr);
};

export const replicateRecipeWithUserGear = async (recipe: SavedRecipe, myPlugins: VSTPlugin[], thinkingLevel: ThinkingLevel = ThinkingLevel.HIGH): Promise<SavedRecipe> => {
  const ai = getAI();
  const receiverStr = myPlugins.length > 0 
    ? myPlugins.map(p => `${p.vendor} - ${p.name}`).join('\n')
    : "No plugins available (use generic stock plugins)";

  const prompt = `
    I have a beat recipe shared by a friend, but I might not own all the plugins used in it.
    My available plugins are:
    ${receiverStr}

    Here is the shared recipe:
    Title: ${recipe.title}
    Style: ${recipe.style}
    BPM: ${recipe.bpm}
    Description: ${recipe.description}
    Instruments: ${JSON.stringify(recipe.instruments)}
    Busses: ${JSON.stringify(recipe.busses)}
    Master Plugins: ${JSON.stringify(recipe.masterPlugins)}
    Artist Types: ${JSON.stringify(recipe.artistTypes)}
    Drum Patterns: ${JSON.stringify(recipe.drumPatterns)}
    Arrangement: ${JSON.stringify(recipe.arrangement)}
    Mixing Advice: ${recipe.mixingAdvice}

    Please adapt this recipe so that it ONLY uses plugins from my available plugins list. 
    If I don't own a plugin used in the recipe, replace it with the most similar plugin I own, and provide new similar parameters for that beat style.
    If I do own the plugin, keep it and keep its parameters.
    Keep the original BPM.
    
    Return the adapted recipe in the exact same JSON structure as the original recipe.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
      responseMimeType: "application/json",
        responseSchema: getUnifiedRecipeSchema()
      }
    });

    let jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("The AI returned an empty response. This usually happens if the recipe is too complex or the API key has limits.");
    }

    // Clean up potential markdown formatting
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }

    let adapted;
    try {
      adapted = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON:", jsonStr);
      throw new Error("The AI generated an invalid recipe format. Please try again.");
    }
    
    // Ensure we merge with the original recipe to preserve any fields the AI might have missed
    // but prioritize the adapted fields for instruments/busses/etc.
    return {
      ...recipe,
      ...adapted,
      id: Math.random().toString(36).substr(2, 9),
      savedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("Error in replicateRecipeWithUserGear:", err);
    throw err;
  }
};
