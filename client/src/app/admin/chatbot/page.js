"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askBot = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const chatHistory = messages.map((msg) => ({
      question: msg.q,
      answer: msg.a,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, chatHistory }),
      });

      const data = await res.json();
      console.log(data);

      setMessages((prevMessages) => [
        ...prevMessages,
        { q: query, a: data.answer, sources: data.sources || [] },
      ]);
      setQuery("");
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          q: query,
          a: "Sorry, I encountered an error. Please try again.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askBot();
    }
  };

  return (
    <div className="flex justify-center w-[1450px] items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Productivity Assistant</h1>
                <p className="text-blue-100 text-sm">
                  Ask me anything about productivity, time management, or work optimization
                </p>
              </div>
            </div>
          </div>

          {/* Chat container */}
          <div className="h-[65vh] overflow-y-auto p-6 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mb-4 text-blue-400 opacity-70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <h3 className="text-lg font-medium mb-1">How can I help you today?</h3>
                <p className="max-w-md">
                  Ask me anything about productivity, time management, or work optimization.
                  I'm here to help you get more done in less time!
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm">
                  <button
                    onClick={() => setQuery("How can I improve my focus?")}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50 transition-all hover:shadow-sm"
                  >
                    Improve focus
                  </button>
                  <button
                    onClick={() => setQuery("Best time management techniques?")}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50 transition-all hover:shadow-sm"
                  >
                    Time management
                  </button>
                  <button
                    onClick={() => setQuery("How to prioritize tasks effectively?")}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50 transition-all hover:shadow-sm"
                  >
                    Task prioritization
                  </button>
                  <button
                    onClick={() => setQuery("Tips for work-life balance?")}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50 transition-all hover:shadow-sm"
                  >
                    Work-life balance
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="mb-6">
                  {/* User message */}
                  <div className="flex justify-end mb-3">
                    <div className="max-w-3/4 bg-blue-600 text-white rounded-2xl rounded-br-none px-5 py-3 shadow-sm">
                      {msg.q}
                    </div>
                  </div>
                  
                  {/* AI response */}
                  <div className="flex justify-start">
                    <div className="max-w-3/4 bg-white border border-gray-200 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm">
                      <div className="prose prose-sm prose-blue max-w-none">
                        <ReactMarkdown
                          components={{
                            strong: ({ node, ...props }) => (
                              <strong
                                className="text-blue-600 font-semibold"
                                {...props}
                              />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="list-disc ml-5 space-y-1" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                              <p className="mb-3 last:mb-0" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                              <a className="text-blue-500 hover:underline" {...props} />
                            ),
                          }}
                        >
                          {msg.a}
                        </ReactMarkdown>
                      </div>
                      
                   
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="relative">
              <textarea
                className="w-full border border-gray-200 rounded-xl p-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Type your question here..."
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                disabled={loading || !query.trim()}
                onClick={askBot}
                className={`absolute right-3 bottom-3 p-2 rounded-full ${loading || !query.trim() ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-all`}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}