'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating practice questions based on uploaded notes.
 *
 * It includes:
 * - GeneratePracticeQuestionsInput: The input type for the generatePracticeQuestions function.
 * - GeneratePracticeQuestionsOutput: The output type for the generatePracticeQuestions function.
 * - generatePracticeQuestions: An async function that takes GeneratePracticeQuestionsInput and returns a Promise of GeneratePracticeQuestionsOutput.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePracticeQuestionsInputSchema = z.object({
  notes: z
    .string()
    .describe('The notes based on which practice questions should be generated.'),
  numQuestions: z
    .number()
    .default(5)
    .describe('The number of practice questions to generate.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium')
    .describe('The difficulty level of the practice questions.'),
});

export type GeneratePracticeQuestionsInput = z.infer<
  typeof GeneratePracticeQuestionsInputSchema
>;

const GeneratePracticeQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('The generated practice questions.'),
});

export type GeneratePracticeQuestionsOutput = z.infer<
  typeof GeneratePracticeQuestionsOutputSchema
>;

export async function generatePracticeQuestions(
  input: GeneratePracticeQuestionsInput
): Promise<GeneratePracticeQuestionsOutput> {
  return generatePracticeQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePracticeQuestionsPrompt',
  input: {schema: GeneratePracticeQuestionsInputSchema},
  output: {schema: GeneratePracticeQuestionsOutputSchema},
  prompt: `You are an expert teacher generating practice questions for students.

  Based on the notes provided, generate {{numQuestions}} practice questions of {{difficulty}} difficulty.

  Notes: {{{notes}}}

  Questions:`,
});

const generatePracticeQuestionsFlow = ai.defineFlow(
  {
    name: 'generatePracticeQuestionsFlow',
    inputSchema: GeneratePracticeQuestionsInputSchema,
    outputSchema: GeneratePracticeQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
