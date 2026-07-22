'use client';

export interface InterviewQuestion {
  question: string;
  hints: string[];
  modelAnswer: string;
  keywords: string[];
}

export const INTERVIEW_BANK: Record<string, InterviewQuestion[]> = {
  behavioral: [
    {
      question: 'Tell me about a time you faced a significant challenge at work or in a project. How did you handle it?',
      hints: ['Use the STAR method', 'Focus on your specific actions', 'Quantify the outcome'],
      modelAnswer: 'Describe the Situation briefly, the Task you were responsible for, the Actions you took, and the measurable Result. Keep it under 2 minutes and emphasize your individual contribution.',
      keywords: ['situation', 'task', 'action', 'result', 'led', 'challenge', 'resolved'],
    },
    {
      question: 'Describe a conflict you had with a teammate. How did you resolve it?',
      hints: ['Show empathy', 'Focus on understanding their perspective', 'End with a positive outcome'],
      modelAnswer: 'Acknowledge the disagreement, explain how you listened to understand their view, the compromise or solution you reached, and what you learned about collaboration.',
      keywords: ['listened', 'understood', 'compromise', 'resolved', 'collaboration', 'perspective'],
    },
    {
      question: 'Tell me about a time you failed. What did you learn?',
      hints: ['Pick a real failure', 'Take ownership', 'Show growth'],
      modelAnswer: 'Choose a genuine failure, own it without blaming others, explain the root cause you identified, and the concrete changes you made to prevent it from happening again.',
      keywords: ['failure', 'learned', 'responsibility', 'improved', 'growth', 'mistake'],
    },
    {
      question: 'Why do you want to work at this company?',
      hints: ['Research the company', 'Connect to your values', 'Be specific'],
      modelAnswer: 'Reference specific products, values, or recent company news. Connect it to your skills and career goals. Avoid generic answers.',
      keywords: ['mission', 'values', 'products', 'specific', 'excited', 'contribute'],
    },
  ],
  technical: [
    {
      question: 'Explain the difference between SQL and NoSQL databases. When would you choose each?',
      hints: ['Mention ACID', 'Give a concrete use case', 'Compare scaling'],
      modelAnswer: 'SQL databases are relational, schema-based, ACID-compliant, and good for structured data with complex joins. NoSQL databases are non-relational, schema-flexible, favor horizontal scaling, and suit unstructured or rapidly-changing data like logs, events, or document storage.',
      keywords: ['relational', 'schema', 'acid', 'scalability', 'joins', 'document', 'key-value'],
    },
    {
      question: 'What happens when you type a URL into a browser and press Enter?',
      hints: ['DNS resolution', 'TCP handshake', 'Render pipeline'],
      modelAnswer: 'Browser parses the URL, does DNS lookup to resolve the domain to an IP, opens a TCP connection (often with TLS handshake), sends an HTTP request, the server responds with HTML, the browser parses HTML, fetches subresources, builds the DOM and CSSOM, renders the render tree, and executes JavaScript.',
      keywords: ['dns', 'tcp', 'tls', 'http', 'request', 'response', 'dom', 'render'],
    },
    {
      question: 'How would you design a URL shortener like bit.ly?',
      hints: ['Discuss encoding', 'Mention collisions', 'Talk about scale'],
      modelAnswer: 'Use a counter or hash function to generate a short code, store the mapping in a key-value store like Redis or DynamoDB, redirect via HTTP 301, handle collisions with retries, and shard by prefix at scale.',
      keywords: ['hash', 'base62', 'collision', 'redirect', 'cache', 'shard', 'key-value'],
    },
    {
      question: 'Explain how HTTPS works.',
      hints: ['TLS handshake', 'Certificates', 'Symmetric + asymmetric'],
      modelAnswer: 'HTTPS combines HTTP with TLS. The client and server do a TLS handshake using asymmetric encryption to exchange keys and verify the server certificate via a CA, then switch to symmetric encryption for the actual data transfer.',
      keywords: ['tls', 'handshake', 'certificate', 'asymmetric', 'symmetric', 'encryption', 'ca'],
    },
  ],
  hr: [
    {
      question: 'Where do you see yourself in 5 years?',
      hints: ['Show ambition', 'Align with the role', 'Be realistic'],
      modelAnswer: 'Show growth aligned with the company — deepening expertise, taking on more responsibility, and contributing to bigger projects. Avoid saying you want to leave or start a competing company.',
      keywords: ['growth', 'learn', 'responsibility', 'contribute', 'develop', 'expertise'],
    },
    {
      question: 'What are your salary expectations?',
      hints: ['Research market rates', 'Give a range', 'Be flexible'],
      modelAnswer: 'Provide a researched range based on the role, location, and your experience. Express flexibility and focus on total compensation including benefits and growth opportunities.',
      keywords: ['range', 'market', 'flexible', 'experience', 'research', 'compensation'],
    },
    {
      question: 'Why are you leaving your current role?',
      hints: ['Stay positive', 'Focus on growth', 'Never badmouth'],
      modelAnswer: 'Frame it positively — seeking new challenges, growth opportunities, or alignment with your long-term goals. Never criticize your current employer or colleagues.',
      keywords: ['growth', 'challenge', 'opportunity', 'learning', 'positive', 'goals'],
    },
  ],
  company: [
    {
      question: 'Why Google / Microsoft / Amazon specifically?',
      hints: ['Reference products', 'Connect to your skills', 'Show genuine interest'],
      modelAnswer: 'Reference specific products or initiatives, connect them to your skills and interests, and show you understand the company culture and engineering challenges.',
      keywords: ['products', 'scale', 'impact', 'culture', 'specific', 'engineering'],
    },
    {
      question: 'Tell me about a product of ours you use. How would you improve it?',
      hints: ['Be specific', 'Identify a real pain point', 'Propose a solution'],
      modelAnswer: 'Pick a real product you use, identify a specific friction point, propose a concrete improvement, and consider tradeoffs or metrics you would track.',
      keywords: ['use', 'feature', 'improve', 'friction', 'metric', 'tradeoff'],
    },
  ],
};

export function evaluateAnswer(answer: string, question: InterviewQuestion): { score: number; feedback: string; suggestions: string[] } {
  if (answer.trim().length < 20) {
    return {
      score: 20,
      feedback: 'Your answer is too short. Aim for at least 3-4 sentences using the STAR or structured format.',
      suggestions: ['Use the STAR method', 'Add specific examples', 'Quantify your impact'],
    };
  }
  const lower = answer.toLowerCase();
  const matched = question.keywords.filter((k) => lower.includes(k));
  const keywordScore = Math.min(60, Math.round((matched.length / question.keywords.length) * 60));
  const lengthScore = Math.min(25, Math.round((answer.length / 500) * 25));
  const structureScore = answer.split(/[.!?]/).filter((s) => s.trim().length > 10).length >= 3 ? 15 : 5;
  const score = keywordScore + lengthScore + structureScore;

  const suggestions: string[] = [];
  if (matched.length < question.keywords.length / 2) suggestions.push('Include more relevant keywords from the model answer.');
  if (answer.length < 200) suggestions.push('Elaborate more — aim for a fuller, structured response.');
  if (!/\d/.test(answer)) suggestions.push('Add quantifiable outcomes (numbers, percentages, timeframes).');

  const feedback = score >= 80
    ? 'Strong answer! You covered the key points well and structured your response clearly.'
    : score >= 60
    ? 'Good answer. With a bit more detail and quantification, it would be excellent.'
    : 'Needs work. Review the hints and try to structure your answer more clearly.';

  return { score, feedback, suggestions };
}
