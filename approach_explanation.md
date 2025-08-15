Approach Explanation: A Multi-Stage, Semantics-Driven Analysis Engine
Our solution for the "Connecting the Dots" challenge is designed to function as an intelligent document analyst, moving beyond simple text extraction to deliver true contextual relevance. The core of our approach is a sophisticated, modular pipeline that first understands the user's intent on a deep level and then uses that understanding to find, rank, and present the most useful information from a collection of documents.
Our analysis engine, analyze_collections.py, is built on a series of independent, single-responsibility functions that work together to create a powerful and generalizable solution.
1. NLP-Powered Query Expansion
We recognized that a user's literal query (their "job-to-be-done") often doesn't contain all the keywords needed for a comprehensive search. To solve this, our engine first acts as a "prompt engineer." The expand_query_with_nlp function uses the Natural Language Toolkit (NLTK) and the WordNet lexical database to perform dynamic query expansion. This process automatically identifies the key concepts in the user's task and enriches the query with a set of relevant synonyms and semantically related terms. This ensures our search is comprehensive and context-aware from the very beginning, allowing us to find conceptually related content, not just keyword matches.
2. Deep Semantic Analysis with a State-of-the-Art Model
The heart of our analysis is powered by the intfloat/e5-base-v2 sentence-embedding model. We chose this model specifically because it is a powerful, instruction-tuned transformer designed for asymmetric search tasks (matching a short query to long document passages) and runs efficiently offline on a CPU. The rank_sections function uses this model to convert our expanded query, every section title, and every section's full text content into "meaning vectors."
3. Sophisticated Multi-Factor Ranking
Our key innovation is a multi-factor scoring system that mimics how a human expert would evaluate relevance. We understand that a section's value is a combination of a good title and good content. Therefore, our rank_sections function produces two independent, ranked lists:
A "Best Sections" List: This list is ranked by a combined score (50% title relevance + 50% content relevance). It identifies the sections with the best overall "fit" and is used to populate the main extracted_sections in the final output.
A "Best Content" List: This list is ranked only by the content score. This allows us to pinpoint the paragraphs with the most contextually rich and detailed information, which we then use to populate the subsection_analysis field.
This modular, multi-stage pipeline, orchestrated by our main conductor script, creates a powerful and generalizable solution. By first enriching the user's query and then performing a deep, multi-faceted analysis, our engine truly "connects the dots" from a simple task description to the most valuable and actionable insights hidden within a mountain of documents.

Dockerfile and Execution Instructions
The entire solution is containerized using Docker to ensure a consistent, reproducible, and fully offline execution environment, as required by the challenge.

Build Command
Navigate to the project's root directory (where the Dockerfile is located) and execute the following command to build the Docker image:
Generated bash
docker build --platform linux/amd64 -t adobe-hackathon-solution .
Use code with caution.
Bash
Run Command
To run the solution, ensure you have an input directory (containing the PDFs and challenge1b_input.json) and an empty output directory in your project root.
Execute the following command from your terminal:
Generated bash
docker run --rm -v "$(pwd)/input:/app/input:ro" -v "$(pwd)/output:/app/output" --network none adobe-hackathon-solution