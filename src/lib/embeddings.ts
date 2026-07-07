import cosineSimilarity from "compute-cosine-similarity";

/**
 * Task types for embeddings optimization
 */
export type EmbeddingTaskType =
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING"
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "CODE_RETRIEVAL_QUERY"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION";

/**
 * Generate embeddings for single or multiple texts
 */
export async function generateEmbeddings(
  content: string | string[],
  options?: {
    taskType?: EmbeddingTaskType;
    outputDimensionality?: 768 | 1536 | 3072;
  }
) {
  const response = await fetch("/api/gemini/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: Array.isArray(content) ? content : undefined,
      content: Array.isArray(content) ? undefined : content,
      taskType: options?.taskType || "RETRIEVAL_DOCUMENT",
      outputDimensionality: options?.outputDimensionality,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate embeddings");
  }

  const data = await response.json();
  return data;
}

/**
 * Calculate semantic similarity between two texts
 * Returns a value between -1 (opposite) and 1 (identical)
 */
export async function calculateSemanticSimilarity(
  text1: string,
  text2: string,
  outputDimensionality?: 768 | 1536 | 3072
): Promise<number> {
  const result = await generateEmbeddings([text1, text2], {
    taskType: "SEMANTIC_SIMILARITY",
    outputDimensionality,
  });

  const embeddings = result.embeddings.map((e: any) => e.values);
  return cosineSimilarity(embeddings[0], embeddings[1]) || 0;
}

/**
 * Find most similar text from a list of candidates
 */
export async function findMostSimilar(
  query: string,
  candidates: string[],
  outputDimensionality?: 768 | 1536 | 3072
): Promise<{ text: string; similarity: number; index: number }> {
  const allTexts = [query, ...candidates];
  const result = await generateEmbeddings(allTexts, {
    taskType: "SEMANTIC_SIMILARITY",
    outputDimensionality,
  });

  const embeddings = result.embeddings.map((e: any) => e.values);
  const queryEmbedding = embeddings[0];

  let maxSimilarity = -1;
  let mostSimilarIndex = 0;

  for (let i = 1; i < embeddings.length; i++) {
    const similarity = cosineSimilarity(queryEmbedding, embeddings[i]) || 0;
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilarIndex = i - 1;
    }
  }

  return {
    text: candidates[mostSimilarIndex],
    similarity: maxSimilarity,
    index: mostSimilarIndex,
  };
}

/**
 * Normalize embedding vector for accurate similarity computation
 * Required for dimensions other than 3072
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  return embedding.map((val) => val / magnitude);
}

/**
 * Classify text into predefined categories using embeddings
 */
export async function classifyText(
  text: string,
  categories: string[],
  outputDimensionality?: 768 | 1536 | 3072
): Promise<{ category: string; confidence: number; index: number }> {
  const result = await findMostSimilar(text, categories, outputDimensionality);
  return {
    category: result.text,
    confidence: result.similarity,
    index: result.index,
  };
}

/**
 * Batch similarity computation for multiple queries
 */
export async function batchSimilaritySearch(
  queries: string[],
  documents: string[],
  outputDimensionality?: 768 | 1536 | 3072
): Promise<
  Array<{
    query: string;
    matches: Array<{ document: string; similarity: number; index: number }>;
  }>
> {
  const allTexts = [...queries, ...documents];
  const result = await generateEmbeddings(allTexts, {
    taskType: "SEMANTIC_SIMILARITY",
    outputDimensionality,
  });

  const embeddings = result.embeddings.map((e: any) => e.values);
  const queryEmbeddings = embeddings.slice(0, queries.length);
  const docEmbeddings = embeddings.slice(queries.length);

  return queries.map((query, qIndex) => {
    const matches = documents.map((doc, dIndex) => ({
      document: doc,
      similarity:
        cosineSimilarity(queryEmbeddings[qIndex], docEmbeddings[dIndex]) || 0,
      index: dIndex,
    }));

    // Sort by similarity descending
    matches.sort((a, b) => b.similarity - a.similarity);

    return { query, matches };
  });
}
