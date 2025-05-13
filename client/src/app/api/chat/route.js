import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    console.log("hello");
    
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

   
    const { data: logs, error } = await supabase
      .from("logs")
      .select("employee_id, timestamp, action, duration_minutes, description, employees(name, department)");

    if (error) {
      throw new Error("Error fetching logs: " + error.message);
    }

    if (!logs.length) {
      return NextResponse.json({ answer: "No logs found in the database." });
    }

   
    const context = logs
      .map(log =>
        `Employee: ${log.employees.name}\nDepartment: ${log.employees.department}\nTask: ${log.description}\nAction: ${log.action}\nDuration: ${log.duration_minutes} minutes\nDate: ${log.timestamp}`
      )
      .join("\n\n");
console.log(logs);


    const prompt = `
      You're an HR assistant analyzing employee work logs. Use this data:
      ${context}

      Respond to: "${query}"
    `;


    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.3 },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      answer: text,
      sources: logs, 
    });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      {
        error: "Internal error",
        details: err.message.includes("API key")
          ? "Invalid Google API key"
          : err.message,
      },
      { status: 500 }
    );
  }
}







// import { createClient } from "@supabase/supabase-js";
// import { NextResponse } from "next/server";
// import { Ollama } from "ollama"; 


// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

// const ollama = new Ollama({
//   model: "gemma:2b",
//   baseUrl: "http://localhost:11434",
//   temperature: 0.3,
// });

// export async function POST(req) {
//   try {
//     const { query } = await req.json();
    
  
//     if (!query?.trim()) {
//       return NextResponse.json(
//         { error: "Query must be a non-empty string" },
//         { status: 400 }
//       );
//     }

   
//     const { data: logs, error } = await supabase
//       .from("logs")
//       .select(`
//         employee_id, 
//         timestamp, 
//         action, 
//         duration_minutes, 
//         description, 
//         employees (name, department)
//       `)
//       .not("employees", "is", null);

//     if (error) throw new Error(`Supabase error: ${error.message}`);
//     if (!logs?.length) {
//       return NextResponse.json(
//         { answer: "No valid employee logs found" },
//         { status: 404 }
//       );
//     }

   
//     const context = logs
//       .map(log => {
//         if (!log.employees) return "";
//         return [
//           `Employee: ${log.employees.name}`,
//           `Department: ${log.employees.department}`,
//           `Action: ${log.action}`,
//           `Duration: ${log.duration_minutes}m`,
//           `Date: ${new Date(log.timestamp).toLocaleDateString()}`,
//           `Details: ${log.description}`
//         ].join("\n");
//       })
//       .filter(Boolean)
//       .join("\n\n");

 
//     const prompt = `
//       You're an HR assistant analyzing employee work logs. Use this data:
//       ${context}

//       Respond to: "${query}"
//     `;

//     const { text } = await ollama.chat({ 
//       messages: [{
//         role: "user",
//         content: prompt
//       }],
//       model: "gemma:2b",
//       temperature: 0.3
//     });

//     return NextResponse.json({
//       answer: text,
//       sources: logs.map(log => ({
//         name: log.employees?.name,
//         department: log.employees?.department,
//         date: log.timestamp
//       }))
//     });

//   } catch (err) {
//     console.error("API Error:", err);
//     return NextResponse.json(
//       { 
//         error: "Analysis failed",
//         details: err.message.replace(/API key/g, "") // Remove sensitive info
//       },
//       { status: 500 }
//     );
//   }
// }


// import { NextResponse } from 'next/server';
// import { QdrantClient } from '@qdrant/js-client-rest';
// import { ChatOllama } from '@langchain/community/chat_models/ollama';
// import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
// import { StringOutputParser } from '@langchain/core/output_parsers';
// import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
// import { PromptTemplate } from '@langchain/core/prompts';
// import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';
// import { formatDocumentsAsString } from 'langchain/util/document';


// const qdrantClient = new QdrantClient({
//   url: process.env.QDRANT_URL || 'http://localhost:6333',
// });

// // Initialize Ollama chat model
// const llm = new ChatOllama({
//   model: "gemma:2b",
//   baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
//   temperature: 0.2,
// });

// // Define the prompt template for answering queries based on retrieved logs
// const promptTemplate = PromptTemplate.fromTemplate(`
// You are an AI assistant that helps answer questions about employees based on their logs.
// Please use the following information to provide accurate answers:

// Context: {context}

// Question: {question}

// Instructions:
// 1. For listing employees, provide names in a clear format.
// 2. For team-specific questions, include team members and their roles.
// 3. When asked about productivity suggestions, analyze patterns in the logs to provide meaningful recommendations.
// 4. Only use information present in the context provided.
// 5. If the information isn't available in the context, acknowledge that.

// Answer:
// `);

// export async function POST(request) {
//   try {
//     const { query } = await request.json();
    
//     if (!query) {
//       return NextResponse.json(
//         { error: "Query parameter is required" },
//         { status: 400 }
//       );
//     }

//     // Initialize embeddings - create a fresh instance for each request to avoid issues
//     const embeddings = new OllamaEmbeddings({
//       model: "gemma:2b", 
//       baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
//     });

//     // Initialize the vector store with the embeddings
//     const vectorStore = await QdrantVectorStore.fromExistingCollection(
//       embeddings,
//       {
//         client: qdrantClient,
//         collectionName: "employee_logs",
//       }
//     );

//     // Create a retriever from the vector store
//     const retriever = vectorStore.asRetriever({
//       k: 5,
//     });
//     console.log(retriever);
    

//     // Create the RAG chain
//     const ragChain = RunnableSequence.from([
//       {
//         context: async (query) => {
//           const docs = await retriever.getRelevantDocuments(query);
//           console.log("🔍 Retrieved Documents:", docs); 
//           return formatDocumentsAsString(docs);
//         },
//         question: new RunnablePassthrough(),
//       },
//       promptTemplate,
//       llm,
//       new StringOutputParser(),
//     ]);

//     const response = await ragChain.invoke(query);
    
//     return NextResponse.json({ answer: response });
//   } catch (error) {
//     console.error("Error processing request:", error);
//     return NextResponse.json(
//       { error: "Error processing your request: " + error.message },
//       { status: 500 }
//     );
//   }
// }

// import { Ollama } from '@langchain/ollama';
// import { OllamaEmbeddings } from '@langchain/ollama';
// import { QdrantVectorStore } from '@langchain/qdrant';
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
// import { createRetrievalChain } from "langchain/chains/retrieval";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { NextResponse } from "next/server";

// const llm = new Ollama({
//   model: 'gemma:2b',
//   temperature: 0.3,
//   num_ctx: 4096,
//   system: "You are a helpful assistant that provides accurate answers based on the given context."
// });

// export async function POST(req) {
//   try {
//     const { query, chatHistory } = await req.json();

//     if (!query) {
//       return NextResponse.json(
//         { error: "Query is required" },
//         { status: 400 }
//       );
//     }

//     const vectorStore = await QdrantVectorStore.fromExistingCollection(
//       new OllamaEmbeddings({
//         model: 'gemma:2b',
//         baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434'
//       }),
//       {
//         url: process.env.QDRANT_URL || 'http://localhost:6333',
//         collectionName: process.env.QDRANT_COLLECTION || 'employee_logs',
//       }
//     );

//     // Enhanced prompt with chat history
//     const prompt = ChatPromptTemplate.fromTemplate(`
//       Use the following context and chat history to answer the question at the end.
//       If you don't know the answer, say you don't know. Don't make up answers.

//       Chat History:
//       {chatHistory}

//       Context:
//       {context}

//       Question: {input}

//       Answer in markdown format:
//     `);

//     const combineDocsChain = await createStuffDocumentsChain({
//       llm,
//       prompt,
//       outputParser: new StringOutputParser(),
//     });

//     const retriever = vectorStore.asRetriever({
//       k: 5,  // Return top 5 most relevant documents
//       filter: {
//         // Optional: Add metadata filters if needed
//         // Example: must: [{ key: "department", match: { value: "engineering" } }]
//       }
//     });

//     const retrievalChain = await createRetrievalChain({
//       combineDocsChain,
//       retriever,
//     });

//     // Execute with conversation context
//     const response = await retrievalChain.invoke({
//       input: query,
//       chatHistory: chatHistory || []
//     });

//     return NextResponse.json({
//       answer: response.answer,
//       sources: response.context.map(doc => ({
//         id: doc.metadata.id,
//         description: doc.metadata.description,
//         employee: doc.metadata.employee_name
//       }))
//     });

//   } catch (error) {
//     console.error("Chat error:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to process query",
//         details: error.message
//       },
//       { status: 500 }
//     );
//   }
// }











