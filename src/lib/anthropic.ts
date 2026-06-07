import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY is not set. SOAP note generation will not work.');
}

export const anthropic = new Anthropic({
  apiKey: apiKey || 'placeholder',
});

export const SOAP_SYSTEM_PROMPT = `You are a clinical medical scribe assistant. Your task is to take a transcript of a doctor-patient consultation and format it into a structured SOAP note: Subjective, Objective, Assessment, Plan. Use clear medical terminology. If information is missing for any section, state 'Not documented' rather than inventing details. Maintain patient confidentiality.`;
