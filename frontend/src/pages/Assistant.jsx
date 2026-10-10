import { useRef, useState } from "react";
import EventCard from "../components/EventCard";
import { sendAssistantMessage } from "../services/assistant";

const SUGGESTIONS = [
  "Find something happening this weekend",
  "Find technology events",
  "Find events with seats available",
  "Find affordable music gatherings",
];

function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function submitMessage(e) {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const history = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const { data } = await sendAssistantMessage(message, history);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer,
          events: data.databaseEvents || [],
          semanticSearchUsed: data.semanticSearchUsed,
        },
      ]);
    } catch (requestError) {
      const messageFromApi = requestError.response?.data?.message;
      setError(messageFromApi || "The assistant could not respond right now. Please try again.");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    setMessages([]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <div className="assistant-page container container-narrow">
      <header className="assistant-heading">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          DISCOVERY GUIDE
        </span>
        <h1>Your personal <em>event assistant.</em></h1>
        <p>Ask about what’s on, specific interests, dates, or prices. Recommendations are grounded in approved city listings.</p>
      </header>

      <div className="assistant-shell">
        {/* Status bar */}
        <div className="assistant-shell-header">
          <div className="assistant-status-indicator">
            <span className="status-live-dot" />
            <strong>HAPPENING Event Assistant</strong>
            <span className="assistant-badge">Authoritative database grounded</span>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              className="button button-light btn-sm"
              onClick={startNewConversation}
            >
              New conversation
            </button>
          )}
        </div>

        {/* Conversation stream */}
        <div className="assistant-messages-stream" aria-live="polite" aria-busy={loading}>
          {messages.length === 0 ? (
            <div className="assistant-welcome-panel">
              <div className="assistant-welcome-icon" aria-hidden="true">✦</div>
              <h2>What are you looking for?</h2>
              <p>Explore city events by category, budget, dates, or available seats.</p>

              <div className="assistant-suggestions-grid">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="suggestion-pill"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    <span>{suggestion}</span>
                    <span className="suggestion-arrow" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((item, index) => (
              <article
                className={`assistant-chat-bubble bubble-${item.role}`}
                key={`${item.role}-${index}`}
              >
                <div className="bubble-avatar" aria-hidden="true">
                  {item.role === "assistant" ? "H" : "You"}
                </div>

                <div className="bubble-body">
                  <span className="bubble-author">
                    {item.role === "assistant" ? "HAPPENING Assistant" : "You"}
                  </span>
                  <div className="bubble-text">{item.content}</div>

                  {item.role === "assistant" && item.events?.length > 0 && (
                    <div className="assistant-grounding-block">
                      <span className="grounding-title">
                        Recommended from the database ({item.events.length})
                      </span>
                      <div className="events-grid grounding-events-grid">
                        {item.events.map((ev) => (
                          <EventCard key={ev.id} event={ev} />
                        ))}
                      </div>
                    </div>
                  )}

                  {item.role === "assistant" && item.semanticSearchUsed && (
                    <span className="assistant-semantic-tag">
                      Matched by meaning and attendee preferences
                    </span>
                  )}
                </div>
              </article>
            ))
          )}

          {loading && (
            <div className="assistant-typing-indicator" role="status">
              <div className="bubble-avatar" aria-hidden="true">H</div>
              <div className="typing-pulse-wrap">
                <span>Searching city listings</span>
                <span className="typing-dots">...</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="assistant-error-banner" role="alert">
            {error}
          </div>
        )}

        {/* Prominent, restrained composer */}
        <form className="assistant-composer-bar" onSubmit={submitMessage}>
          <label className="visually-hidden" htmlFor="assistant-message">
            Message the event assistant
          </label>
          <input
            id="assistant-message"
            ref={inputRef}
            type="text"
            maxLength={1000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about concerts, workshops, technology events..."
            disabled={loading}
          />

          <span className="composer-char-count">{input.length}/1000</span>

          <button
            type="submit"
            className="button button-dark composer-submit-btn"
            disabled={loading || !input.trim()}
            aria-label="Send query"
          >
            {loading ? "…" : "Ask"}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="assistant-disclaimer">
          Event titles, dates, venues, prices, and availability are verified against the HAPPENING database.
          Recommendations are suggestions; bookings are confirmed upon registration.
        </p>
      </div>
    </div>
  );
}

export default Assistant;
