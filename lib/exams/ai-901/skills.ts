import type { SkillSummary } from '../../types';

const CONCEPTS = 'Identify AI concepts and capabilities';
const FOUNDRY = 'Implement AI solutions by using Microsoft Foundry';

export const skillSummaries: Record<string, SkillSummary> = {
  'Describe principles of responsible AI': {
    skill: 'Describe principles of responsible AI',
    bullets: [
      'Fairness: AI systems must treat all groups equitably; audit and test for bias.',
      'Reliability and safety: systems must work correctly, consistently, and fail safely — express uncertainty instead of guessing.',
      'Privacy and security: protect personal data throughout the lifecycle; restrict access, anonymize training data, log usage.',
      'Inclusiveness: design for everyone — diverse languages, accents, abilities, and backgrounds.',
      'Transparency: users should know when they interact with AI and understand its decisions and limits.',
      'Accountability: people (not AI) are accountable for outcomes; name owners, define governance and monitoring.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview',
  },
  'Identify AI model components and configurations': {
    skill: 'Identify AI model components and configurations',
    bullets: [
      'Generative models predict the next token from a probability distribution over the vocabulary, given the context.',
      'A token is a small unit of text; the context window limits how much input the model considers.',
      'Select models by capability: multimodal (text, image, audio), text-only, embeddings, and image-generation models.',
      'Deployment options: serverless (per-token, auto-scale) vs provisioned throughput (reserved capacity, predictable cost).',
      'Generation parameters: temperature (randomness), max tokens (output length), system prompt (behavior).',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-foundry/what-is-ai-foundry',
  },
  'Identify AI workloads': {
    skill: 'Identify AI workloads',
    bullets: [
      'Generative AI creates new content; agentic AI plans and executes multi-step tasks with tools.',
      'Text analysis: keyword extraction, entity detection (NER), sentiment analysis, and summarization.',
      'Speech recognition converts audio to text; speech synthesis converts text to audio.',
      'Computer vision reads and analyzes images (OCR, object detection); image-generation models create visuals from prompts.',
      'Information extraction pulls structured data from text, images, audio, and video.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/what-are-ai-services',
  },
  'Implement generative AI apps and agents by using Foundry': {
    skill: 'Implement generative AI apps and agents by using Foundry',
    bullets: [
      'System prompt sets role, tone, format, and constraints; user prompt carries the request.',
      'Deploy a model in the Foundry portal and test it in the chat playground.',
      'Lightweight chat clients call the deployment via the Foundry SDK with the endpoint, deployment name, and credentials.',
      'Agents combine a model with tools (file search, code interpreter, API connections) and instructions.',
      'Agent conversations run on threads; each user message starts a run that may call tools before the final answer.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview',
  },
  'Implement AI solutions for text and speech by using Foundry': {
    skill: 'Implement AI solutions for text and speech by using Foundry',
    bullets: [
      'Text analysis (sentiment, entities, summarization) is done with model deployments in Foundry.',
      'Multimodal models accept spoken prompts and respond in text (or other modalities).',
      'Azure Speech provides speech-to-text and text-to-speech via the Speech SDK or Foundry Tools.',
      'Speech-to-text handles long, noisy audio with speaker diarization; multimodal audio input suits short conversational questions.',
      'Speech clients need a Speech resource key and region.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview',
  },
  'Implement AI solutions with computer vision and image-generation capabilities by using Foundry': {
    skill: 'Implement AI solutions with computer vision and image-generation capabilities by using Foundry',
    bullets: [
      'Multimodal models interpret visual input: send the image with the text prompt.',
      'Image-generation models create new images from text descriptions.',
      'Lightweight vision apps send image + prompt via the SDK and handle the returned content.',
      'OCR reads text from images; object detection finds objects; each maps to the right capability.',
      'Choose the capability by task: analyze existing images vs generate new ones.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-foundry/model-catalog/model-catalog-overview',
  },
  'Implement AI solutions for information extraction by using Foundry': {
    skill: 'Implement AI solutions for information extraction by using Foundry',
    bullets: [
      'Azure Content Understanding extracts structured fields from documents, forms, images, audio, and video.',
      'Analyzers define the fields to extract; the application calls the analyzer with content and receives structured JSON.',
      'Document/forms extraction reads fields with OCR; image extraction handles scanned forms.',
      'Audio/video extraction transcribes speech with time-stamped segments and speaker identification.',
      'Integration flow: create project → create analyzer → test with samples → integrate into the app.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview',
  },
};

export const skillDomains: Record<string, string> = {
  'Describe principles of responsible AI': CONCEPTS,
  'Identify AI model components and configurations': CONCEPTS,
  'Identify AI workloads': CONCEPTS,
  'Implement generative AI apps and agents by using Foundry': FOUNDRY,
  'Implement AI solutions for text and speech by using Foundry': FOUNDRY,
  'Implement AI solutions with computer vision and image-generation capabilities by using Foundry': FOUNDRY,
  'Implement AI solutions for information extraction by using Foundry': FOUNDRY,
};
